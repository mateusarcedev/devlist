-- New Supabase database only. Do not run against the legacy Prisma database.
create extension if not exists pgcrypto;

create type public.user_role as enum ('USER','ADMIN');
create type public.suggestion_status as enum ('PENDING','APPROVED','REJECTED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_id bigint unique,
  name text not null default '',
  email text not null default '',
  avatar text not null default '',
  role public.user_role not null default 'USER',
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 120)
);
create table public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  link text not null unique check (link ~* '^https?://'),
  description text not null check (length(trim(description)) between 1 and 230),
  category_id uuid not null references public.categories(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index tools_category_id_idx on public.tools(category_id);
create index tools_name_idx on public.tools(name);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_tool_unique unique(user_id,tool_id)
);
create index favorites_tool_id_idx on public.favorites(tool_id);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  link text not null check (link ~* '^https?://'),
  description text not null check (length(trim(description)) between 1 and 230),
  category_id uuid not null references public.categories(id) on delete restrict,
  tool_id uuid references public.tools(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.suggestion_status not null default 'PENDING',
  created_at timestamptz not null default now()
);
create index suggestions_user_id_idx on public.suggestions(user_id);
create index suggestions_status_idx on public.suggestions(status);

-- Checking the DB role via a security-definer function avoids recursive RLS
-- and never trusts a JWT role/metadata value provided by the browser.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
 select exists(select 1 from public.profiles
 where id=(select auth.uid()) and role='ADMIN');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare supplied_id text;
begin
 supplied_id:=coalesce(new.raw_user_meta_data->>'provider_id',
                       new.raw_user_meta_data->>'sub');
 insert into public.profiles(id,github_id,name,email,avatar)
 values(
  new.id,
  case when new.raw_app_meta_data->>'provider'='github'
       and supplied_id ~ '^[0-9]+$'
       then supplied_id::bigint else null end,
  coalesce(new.raw_user_meta_data->>'full_name',
           new.raw_user_meta_data->>'name',
           new.raw_user_meta_data->>'user_name',''),
  coalesce(new.email,''),
  coalesce(new.raw_user_meta_data->>'avatar_url','')
 );
 return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tools enable row level security;
alter table public.favorites enable row level security;
alter table public.suggestions enable row level security;

create policy "Read own profile" on public.profiles for select
to authenticated using(id=(select auth.uid()));

create policy "Read categories" on public.categories for select
to anon,authenticated using(true);
create policy "Admins insert categories" on public.categories for insert
to authenticated with check((select public.is_admin()));
create policy "Admins update categories" on public.categories for update
to authenticated using((select public.is_admin()))
with check((select public.is_admin()));
create policy "Admins delete categories" on public.categories for delete
to authenticated using((select public.is_admin()));

create policy "Read tools" on public.tools for select
to anon,authenticated using(true);
create policy "Admins insert tools" on public.tools for insert
to authenticated with check((select public.is_admin()));
create policy "Admins update tools" on public.tools for update
to authenticated using((select public.is_admin()))
with check((select public.is_admin()));
create policy "Admins delete tools" on public.tools for delete
to authenticated using((select public.is_admin()));

create policy "Read own favorites" on public.favorites for select
to authenticated using(user_id=(select auth.uid()));
create policy "Add own favorites" on public.favorites for insert
to authenticated with check(user_id=(select auth.uid()));
create policy "Remove own favorites" on public.favorites for delete
to authenticated using(user_id=(select auth.uid()));

create policy "Read own or admin suggestions" on public.suggestions for select
to authenticated using(user_id=(select auth.uid()) or (select public.is_admin()));
create policy "Submit pending suggestions" on public.suggestions for insert
to authenticated with check(user_id=(select auth.uid()) and status='PENDING' and tool_id is null);
create policy "Admins update suggestions" on public.suggestions for update
to authenticated using((select public.is_admin()))
with check((select public.is_admin()));
create policy "Admins delete suggestions" on public.suggestions for delete
to authenticated using((select public.is_admin()));

grant usage on schema public to anon,authenticated;
grant select on public.categories,public.tools to anon,authenticated;
grant select on public.profiles,public.favorites,public.suggestions to authenticated;
grant insert,update,delete on public.categories,public.tools,public.suggestions to authenticated;
grant insert,delete on public.favorites to authenticated;
