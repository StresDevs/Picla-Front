-- Allow credit as a valid payment method for POS sales.
alter table public.pos_sales
  drop constraint if exists pos_sales_payment_method_check;

alter table public.pos_sales
  add constraint pos_sales_payment_method_check
  check (payment_method = any (array['cash', 'card', 'qr', 'credit']::text[]));
