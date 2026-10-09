-- Ejecutar en Supabase para resolver vendedores históricos en todos los roles del POS.
-- Mantiene la firma existente de pos_get_sales y las políticas de users.
BEGIN;
CREATE OR REPLACE FUNCTION public.pos_get_sale_receipt_details(p_branch_id uuid DEFAULT NULL)
RETURNS TABLE(sale_id uuid, sold_by_name text, exchange_rate numeric, metadata jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_branch_id uuid;
BEGIN
  IF public.current_request_user_id() IS NULL OR
     coalesce(public.pos_current_role_name(), '') NOT IN ('admin', 'manager', 'employee', 'read_only') THEN
    RAISE EXCEPTION 'No tienes acceso al historial de ventas';
  END IF;
  v_branch_id := public.pos_resolve_branch(p_branch_id);
  RETURN QUERY
    SELECT s.id,
      coalesce(nullif(s.metadata->>'created_by_name', ''), nullif(s.metadata->>'converted_by_name', ''),
               nullif(u.full_name, ''), 'No registrado'),
      s.exchange_rate, s.metadata
    FROM public.pos_sales s
    LEFT JOIN public.users u ON u.id = s.sold_by
    WHERE s.branch_id = v_branch_id;
END;
$$;
REVOKE ALL ON FUNCTION public.pos_get_sale_receipt_details(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pos_get_sale_receipt_details(uuid) TO authenticated;
COMMIT;
