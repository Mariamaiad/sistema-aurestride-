-- =============================================================
-- Storage: bucket público de imagens do site
-- Limite de 5 MB; apenas JPG, PNG, WebP e AVIF (SVG fica de fora por
-- poder conter scripts). Upload e remoção apenas por administradores.
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "site_media_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'site-media');

create policy "site_media_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site-media' and public.is_admin());

create policy "site_media_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'site-media' and public.is_admin())
  with check (bucket_id = 'site-media' and public.is_admin());

create policy "site_media_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'site-media' and public.is_admin());
