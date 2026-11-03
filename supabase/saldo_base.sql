-- South Tennis · Sistema de gestión
-- Saldo base "desde este momento": guarda el último movimiento de caja que ya está incluido
-- en el saldo base. Así, si pones el saldo base hoy, las ventas que se registren después sí se suman
-- (antes se ignoraba todo lo del mismo día).
-- Correr una sola vez en Supabase → SQL Editor.

alter table public.config add column if not exists saldo_hasta_id bigint;
