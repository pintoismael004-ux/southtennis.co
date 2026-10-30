-- ════════════════════════════════════════════════════════════════════
-- South Tennis — permisos de la base de datos
--
-- Ejecutar en Supabase → SQL Editor, DESPUÉS de:
--   1. crear los usuarios en Authentication → Users
--      (ismaelpinto@southtennis.co y lauratirado@southtennis.co, con "Auto Confirm User")
--   2. publicar la versión del sitio que inicia sesión con Supabase Auth (sesion.js)
--
-- Resultado:
--   · Solo el equipo con sesión iniciada lee y modifica los datos.
--   · El catálogo público solo puede LEER el inventario, y sin el precio de compra.
--   · El equipo con sesión puede subir fotos al bucket ZAPATOS.
-- Se puede ejecutar más de una vez.
-- ════════════════════════════════════════════════════════════════════

-- 1) Todas las tablas: activar RLS, quitar permisos anteriores y dar acceso solo al equipo con sesión
do $$
declare t record; p record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t.tablename loop
      execute format('drop policy %I on public.%I', p.policyname, t.tablename);
    end loop;
    execute format('create policy "equipo con sesion" on public.%I for all to authenticated using (true) with check (true)', t.tablename);
  end loop;
end $$;

-- 2) Visitantes sin sesión: nada, excepto leer el inventario para el catálogo
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select (id, nombre, talla, genero, cant, precio, foto_url) on public.inventario to anon;
create policy "catalogo publico lee inventario" on public.inventario for select to anon using (true);
-- Si en el futuro agregas columnas que el catálogo deba mostrar (ej. promo_precio, color, destacado),
-- agrégalas también aquí:  grant select (promo_precio) on public.inventario to anon;

-- 3) Fotos: el equipo con sesión puede subirlas; el bucket sigue siendo público para verlas
drop policy if exists "subir fotos catalogo" on storage.objects;
drop policy if exists "equipo sube fotos" on storage.objects;
create policy "equipo sube fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'ZAPATOS');

-- Verificación (opcional): debe listar "equipo con sesion" en cada tabla
-- select tablename, policyname, roles from pg_policies where schemaname = 'public' order by tablename;
