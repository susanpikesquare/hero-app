-- Self-care / no-photo chores.
--
-- Erica's feedback: "I wonder if we want to consider a self care aspect
-- to this too. Like teeth brush etc... while we would not take pics of
-- the kids at all; reminders are good."
--
-- We model this as a `verification_kind` enum on the chore. 'photo' is
-- the existing path (kid uploads a photo, AI evaluates). 'checklist' is
-- the new path: kid taps "Mark done," no photo, no AI, the submission
-- goes straight to 'complete' with a synthesized "self-reported" verdict.
--
-- The submissions.photo_path column has to become nullable to hold
-- these no-photo rows. Existing photo submissions are unaffected.

create type public.verification_kind as enum ('photo', 'checklist');

alter table public.chores
  add column if not exists verification_kind public.verification_kind
    not null default 'photo';

comment on column public.chores.verification_kind is
  'How the kid submits proof. ''photo'' (default) uses the camera + AI eval. ''checklist'' is a no-photo tap-to-confirm flow for self-care chores like brushing teeth.';

-- Allow checklist submissions to have no photo.
alter table public.submissions
  alter column photo_path drop not null;

comment on column public.submissions.photo_path is
  'Storage path of the kid''s submitted photo. NULL when the parent chose ''checklist'' verification for the chore (e.g. brushing teeth).';
