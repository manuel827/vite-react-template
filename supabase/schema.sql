create type public.tip_result as enum ('pending', 'won', 'lost');

create table public.tips (
	id uuid primary key default gen_random_uuid(),
	league text not null check (char_length(league) between 1 and 100),
	match_date date not null,
	kickoff time not null,
	home_team text not null check (char_length(home_team) between 1 and 100),
	away_team text not null check (char_length(away_team) between 1 and 100),
	pick text not null check (char_length(pick) between 1 and 1000),
	odds numeric(7, 2) not null check (odds >= 1.01),
	confidence smallint not null check (confidence between 1 and 3),
	analysis text check (analysis is null or char_length(analysis) <= 1000),
	result public.tip_result not null default 'pending',
	score text check (score is null or char_length(score) <= 20),
	published boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index tips_published_date_idx
	on public.tips (match_date, kickoff)
	where published = true;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create trigger tips_set_updated_at
	before update on public.tips
	for each row
	execute function public.set_updated_at();

alter table public.tips enable row level security;

grant select on public.tips to anon, authenticated;
grant insert, update, delete on public.tips to authenticated;

create policy "Published tips are visible to everyone"
	on public.tips
	for select
	to anon, authenticated
	using (published = true or (select public.is_admin()));

create policy "Admins can create tips"
	on public.tips
	for insert
	to authenticated
	with check ((select public.is_admin()));

create policy "Admins can update tips"
	on public.tips
	for update
	to authenticated
	using ((select public.is_admin()))
	with check ((select public.is_admin()));

create policy "Admins can delete tips"
	on public.tips
	for delete
	to authenticated
	using ((select public.is_admin()));
