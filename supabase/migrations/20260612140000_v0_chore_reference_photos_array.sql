-- Multiple reference photos per chore.
--
-- Susan QA (2026-06-12): a parent should be able to upload more than one
-- example photo for a chore (e.g. "made bed from the front" + "from the
-- side" + "drawers closed"). Until now chores had a single
-- reference_photo_path.
--
-- Design:
--   - reference_photo_paths text[] is the gallery (source of truth).
--   - reference_photo_path stays as the PRIMARY photo (= paths[0]) so the
--     AI evaluator and any single-photo display keep working unchanged.
--   - App code keeps the two in sync: writing the array also sets the
--     primary to its first element (or null when empty).

alter table public.chores
  add column if not exists reference_photo_paths text[] not null default '{}';

-- Backfill: every chore that already has a single reference photo gets a
-- one-element array.
update public.chores
  set reference_photo_paths = array[reference_photo_path]
  where reference_photo_path is not null
    and (reference_photo_paths is null or array_length(reference_photo_paths, 1) is null);
