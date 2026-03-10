-- Progress photos bucket and RLS policies
-- Path convention: {user_id}/{date}-{timestamp}.jpg so users only access their own folder.

-- Create the bucket (public so getPublicUrl() works without signed URLs).
-- Optional: set file_size_limit and allowed_mime_types in Dashboard if needed.
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', true)
on conflict (id) do update set public = excluded.public;

-- RLS on storage.objects is usually already enabled by Supabase.
-- Policies: only allow access when the object path starts with the current user's id.

-- Allow authenticated users to upload only into their own folder: {user_id}/...
create policy "Users can upload own progress photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to read only their own objects
create policy "Users can read own progress photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update only their own objects (e.g. replace image)
create policy "Users can update own progress photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete only their own objects
create policy "Users can delete own progress photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
