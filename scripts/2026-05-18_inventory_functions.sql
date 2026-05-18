CREATE OR REPLACE FUNCTION public.create_inventory_entry_v2(
  p_branch_id uuid,
  p_part_id uuid,
  p_quantity numeric,
  p_reason text DEFAULT NULL::text,
  p_source_reference text DEFAULT NULL::text,
  p_supplier_name text DEFAULT NULL::text,
  p_notes text DEFAULT NULL::text,
  p_unit_cost numeric DEFAULT NULL::numeric,
  p_unit_price numeric DEFAULT NULL::numeric,
  p_currency text DEFAULT 'BOB'::text,
  p_exchange_rate numeric DEFAULT NULL::numeric,
  p_restock_mode text DEFAULT 'instant'::text,
  p_estimated_arrival_date date DEFAULT NULL::date,
  p_quotation_min_price numeric DEFAULT NULL::numeric,
  p_quotation_max_price numeric DEFAULT NULL::numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_entry_id uuid;
  v_currency text;
  v_reason text;
  v_restock_mode text;
  v_avg_cost numeric(12, 2);
  v_avg_price numeric(12, 2);
begin
  if not public.inventory_is_admin() then
    raise exception 'Only admin can register inventory entries';
  end if;

  if p_branch_id is null or p_part_id is null then
    raise exception 'Branch and product are required';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  if not exists (
    select 1
    from public.parts p
    where p.id = p_part_id
      and p.branch_id = p_branch_id
  ) then
    raise exception 'Product % does not belong to branch %', p_part_id, p_branch_id;
  end if;

  if p_unit_cost is not null and p_unit_cost < 0 then
    raise exception 'Unit cost cannot be negative';
  end if;

  if p_unit_price is not null and p_unit_price < 0 then
    raise exception 'Unit price cannot be negative';
  end if;

  if p_quotation_min_price is not null and p_quotation_min_price < 0 then
    raise exception 'Quotation min price cannot be negative';
  end if;

  if p_quotation_max_price is not null and p_quotation_max_price < 0 then
    raise exception 'Quotation max price cannot be negative';
  end if;

  if p_quotation_min_price is not null and p_quotation_max_price is not null and p_quotation_min_price > p_quotation_max_price then
    raise exception 'Quotation min price cannot be greater than max price';
  end if;

  v_currency := upper(coalesce(nullif(trim(p_currency), ''), 'BOB'));
  if v_currency not in ('BOB', 'USD') then
    raise exception 'Currency must be BOB or USD';
  end if;

  if v_currency = 'USD' and (p_exchange_rate is null or p_exchange_rate <= 0) then
    raise exception 'Exchange rate is required and must be greater than zero for USD entries';
  end if;

  v_restock_mode := lower(coalesce(nullif(trim(p_restock_mode), ''), 'instant'));
  if v_restock_mode not in ('instant', 'queued') then
    raise exception 'Invalid restock mode. Use instant or queued';
  end if;

  if v_restock_mode = 'queued' and p_estimated_arrival_date is null then
    raise exception 'Estimated arrival date is required for queued restock';
  end if;

  v_reason := coalesce(nullif(trim(p_reason), ''), 'Ingreso de mercaderia');

  if v_restock_mode = 'instant' and (p_unit_cost is not null or p_unit_price is not null) then
    update public.parts
    set
      cost = case
        when p_unit_cost is null then cost
        else round(((coalesce(cost, p_unit_cost) + p_unit_cost) / 2)::numeric, 2)
      end,
      price = case
        when p_unit_price is null then price
        else round(((coalesce(price, p_unit_price) + p_unit_price) / 2)::numeric, 2)
      end,
      updated_by = auth.uid(),
      updated_at = now()
    where id = p_part_id
    returning cost, price into v_avg_cost, v_avg_price;

    if p_unit_price is not null then
      insert into public.product_price_tiers (part_id, min_quantity, price)
      values (p_part_id, 1, coalesce(v_avg_price, p_unit_price))
      on conflict (part_id, min_quantity)
      do update set
        price = excluded.price,
        updated_at = now();
    end if;
  end if;

  if p_quotation_min_price is not null or p_quotation_max_price is not null then
    update public.parts
    set
      quotation_min_price = case
        when p_quotation_min_price is null then quotation_min_price
        else p_quotation_min_price
      end,
      quotation_max_price = case
        when p_quotation_max_price is null then quotation_max_price
        else p_quotation_max_price
      end,
      updated_by = auth.uid(),
      updated_at = now()
    where id = p_part_id;
  end if;

  insert into public.inventory_entries (
    branch_id,
    part_id,
    quantity,
    expected_quantity,
    received_quantity,
    restock_mode,
    reception_status,
    is_fully_received,
    estimated_arrival_date,
    received_by,
    received_at,
    unit_cost,
    unit_price,
    average_cost_applied,
    average_price_applied,
    currency,
    exchange_rate,
    source_reference,
    supplier_name,
    reason,
    notes,
    created_by
  )
  values (
    p_branch_id,
    p_part_id,
    p_quantity,
    p_quantity,
    case when v_restock_mode = 'instant' then p_quantity else 0 end,
    v_restock_mode,
    case when v_restock_mode = 'instant' then 'completed' else 'pending' end,
    case when v_restock_mode = 'instant' then true else false end,
    case when v_restock_mode = 'queued' then p_estimated_arrival_date else null end,
    case when v_restock_mode = 'instant' then auth.uid() else null end,
    case when v_restock_mode = 'instant' then now() else null end,
    p_unit_cost,
    p_unit_price,
    v_avg_cost,
    v_avg_price,
    v_currency,
    case when v_currency = 'USD' then p_exchange_rate else null end,
    nullif(trim(coalesce(p_source_reference, '')), ''),
    nullif(trim(coalesce(p_supplier_name, '')), ''),
    v_reason,
    nullif(trim(coalesce(p_notes, '')), ''),
    auth.uid()
  )
  returning id into v_entry_id;

  if v_restock_mode = 'instant' then
    perform public.apply_inventory_delta(
      p_part_id,
      p_branch_id,
      p_quantity,
      v_reason,
      'ingreso_restock',
      'inventory_entries',
      v_entry_id,
      jsonb_build_object(
        'source_reference', p_source_reference,
        'supplier_name', p_supplier_name,
        'currency', v_currency,
        'exchange_rate', case when v_currency = 'USD' then p_exchange_rate else null end,
        'unit_cost', p_unit_cost,
        'unit_price', p_unit_price,
        'restock_mode', v_restock_mode,
        'estimated_arrival_date', null,
        'expected_quantity', p_quantity,
        'received_quantity', p_quantity,
        'pending_quantity', 0,
        'average_cost_applied', v_avg_cost,
        'average_price_applied', v_avg_price,
        'quotation_min_price', p_quotation_min_price,
        'quotation_max_price', p_quotation_max_price
      )
    );
  end if;

  return v_entry_id;
end;
$function$;
