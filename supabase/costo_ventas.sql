-- South Tennis · Sistema de gestión
-- Guarda el costo de cada par en la venta, para que la utilidad del mes no cambie
-- si después se edita o se borra el producto del inventario.
-- Correr una sola vez en Supabase → SQL Editor.

alter table public.ventas add column if not exists costo_unit integer not null default 0;

-- Llenar el costo de las ventas que ya están registradas este mes con el costo actual del inventario
update public.ventas v
set costo_unit = coalesce(i.pc, 0)
from public.inventario i
where v.costo_unit = 0
  and upper(trim(i.nombre)) = upper(trim(v.ref))
  and i.talla::text = v.talla::text;
