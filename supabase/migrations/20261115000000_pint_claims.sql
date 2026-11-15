-- One free pint per person for a perfect "Split the G".
-- Written to only by the split-the-g Edge Function (which uses the service role).
create table if not exists public.pint_claims (
  user_id uuid primary key references auth.users (id) on delete cascade,
  claimed_at timestamptz not null default now()
);

alter table public.pint_claims enable row level security;

-- The host (admins) can see who has claimed a free pint; nobody else can read or write it from the browser.
create policy "Admins can see pint claims"
  on public.pint_claims for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
