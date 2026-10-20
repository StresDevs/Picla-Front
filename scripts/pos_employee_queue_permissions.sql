-- Ejecutar en Supabase para permitir que empleados y solo lectura encolen ventas.
-- Tambien se aplica al pago mixto, que utiliza pos_enqueue_sale internamente.
BEGIN;

CREATE OR REPLACE FUNCTION public.pos_can_queue_sale()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT coalesce(public.pos_current_role_name() IN ('employee', 'read_only'), false);
$$;

COMMIT;
