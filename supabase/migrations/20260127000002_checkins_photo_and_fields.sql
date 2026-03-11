-- Add optional photo attachment support to check-ins.
-- Stores a Supabase Storage object path (typically under `${auth.uid()}/checkins/...`).

alter table public.check_ins
add column if not exists photo_path text;

