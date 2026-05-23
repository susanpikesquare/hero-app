-- Private buckets. RLS policies on storage.objects will land in the next
-- session when the photo-upload flow ships. For now: buckets exist, but
-- with RLS-default-deny on storage.objects no one can read or write them.
insert into storage.buckets (id, name, public)
values
  ('reference-photos', 'reference-photos', false),
  ('submissions', 'submissions', false)
on conflict (id) do nothing;
