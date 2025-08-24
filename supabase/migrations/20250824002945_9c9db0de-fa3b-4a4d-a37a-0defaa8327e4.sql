
-- Create a public bucket for branding assets (idempotent)
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Public read access for branding bucket
create policy if not exists "Public read for branding"
on storage.objects
for select
to public
using (bucket_id = 'branding');

-- Authenticated users can upload to branding
create policy if not exists "Authenticated can upload branding"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'branding');

-- Authenticated users can update their own objects in branding
create policy if not exists "Update own branding objects"
on storage.objects
for update
to authenticated
using (bucket_id = 'branding' and owner = auth.uid())
with check (bucket_id = 'branding' and owner = auth.uid());

-- Authenticated users can delete their own objects in branding
create policy if not exists "Delete own branding objects"
on storage.objects
for delete
to authenticated
using (bucket_id = 'branding' and owner = auth.uid());
