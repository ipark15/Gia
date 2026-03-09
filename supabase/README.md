# Supabase setup for Gia

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the contents of `migrations/20260127000000_initial_schema.sql`.
3. In Dashboard → Storage, create a bucket named `progress-photos` (public or private; if private, use signed URLs when displaying images).
4. Add Storage policies so authenticated users can upload/read/delete only their own files (e.g. path prefix `{user_id}/`).

Add to your project root a `.env` (or configure in app.config.js) with:
- `EXPO_PUBLIC_SUPABASE_URL` = your project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` = your anon key
