-- v0 schema: families, parents/kids, chores, submissions (placeholder), invite codes.
-- Submissions table is created now so we don't churn migrations later;
-- writes to it land in the next session along with the AI photo eval.

create type public.member_role as enum ('parent', 'kid');
create type public.submission_status as enum ('pending_ai', 'pending_parent', 'complete');
create type public.ai_verdict as enum ('pass', 'needs_work');
create type public.override_kind as enum ('approved', 'rejected');
create type public.override_reason as enum ('good_enough_today', 'worked_hard', 'help_with_rest');

-- Invite codes (Erica issues these; checked at signup, never readable client-side)
create table public.invite_codes (
  code text primary key,
  issued_to_label text,
  max_uses integer not null default 1,
  times_used integer not null default 0,
  expires_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Families (one row per signed-up parent's household)
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code_used text references public.invite_codes(code),
  created_at timestamptz not null default now()
);

-- Family members. Parents have an auth_user_id (Supabase Auth user); kids don't in v0.
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  role public.member_role not null,
  display_name text not null,
  created_at timestamptz not null default now()
);
create unique index family_members_auth_user_id_unique
  on public.family_members(auth_user_id)
  where auth_user_id is not null;
create index family_members_family_id_idx on public.family_members(family_id);

-- Chores. v1 = bedroom (tidy + bed made), one row per kid x chore.
create table public.chores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  kid_id uuid not null references public.family_members(id) on delete cascade,
  title text not null,
  kind text not null default 'bedroom',
  reference_photo_path text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index chores_family_id_idx on public.chores(family_id);
create index chores_kid_id_idx on public.chores(kid_id);

-- Submissions (schema only in v0; client writes land next session with the AI eval flow).
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid not null references public.chores(id) on delete cascade,
  submitted_by uuid references public.family_members(id) on delete set null,
  photo_path text not null,
  status public.submission_status not null default 'pending_ai',
  ai_verdict public.ai_verdict,
  ai_feedback text,
  ai_evaluated_at timestamptz,
  parent_override public.override_kind,
  parent_override_reason public.override_reason,
  parent_override_by uuid references public.family_members(id) on delete set null,
  parent_override_at timestamptz,
  submitted_at timestamptz not null default now()
);
create index submissions_chore_id_idx on public.submissions(chore_id);
