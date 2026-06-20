-- supabase/migrations/001_initial.sql

create extension if not exists "uuid-ossp";

create table couples (
  id           uuid primary key default uuid_generate_v4(),
  invite_code  text unique not null default substr(md5(random()::text), 1, 8),
  user1_id     uuid not null references auth.users(id) on delete cascade,
  user2_id     uuid references auth.users(id) on delete cascade,
  created_at   timestamptz default now()
);

-- Helper: returns partner's user id for the current auth user
create or replace function get_partner_id()
returns uuid language sql security definer stable as $$
  select case
    when user1_id = auth.uid() then user2_id
    when user2_id = auth.uid() then user1_id
  end
  from couples
  where user1_id = auth.uid() or user2_id = auth.uid()
  limit 1;
$$;

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  couple_id     uuid references couples(id) on delete set null,
  created_at    timestamptz default now()
);

create table films_cache (
  tmdb_id    integer primary key,
  title      text not null,
  poster_url text,
  year       integer,
  genres     text[] default '{}',
  runtime    integer,
  overview   text,
  director   text,
  cached_at  timestamptz default now()
);

create table user_films (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid references auth.users(id) on delete cascade not null,
  tmdb_id   integer references films_cache(tmdb_id) on delete cascade not null,
  status    text check (status in ('wishlist','watched')) not null,
  score     numeric(3,1) check (score >= 0.5 and score <= 10.0),
  added_at  timestamptz default now(),
  unique(user_id, tmdb_id)
);

create table comments (
  id         uuid primary key default uuid_generate_v4(),
  tmdb_id    integer references films_cache(tmdb_id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  body       text not null check (char_length(body) > 0),
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- RLS
alter table profiles    enable row level security;
alter table films_cache enable row level security;
alter table user_films  enable row level security;
alter table comments    enable row level security;
alter table couples     enable row level security;

-- profiles: read own or partner; write own only
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or id = get_partner_id());
create policy "profiles_insert" on profiles for insert
  with check (id = auth.uid());
create policy "profiles_update" on profiles for update
  using (id = auth.uid());

-- films_cache: any authenticated user can read/write (it's just a cache)
create policy "films_cache_all" on films_cache for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- user_films: read own or partner; write own only
create policy "user_films_select" on user_films for select
  using (user_id = auth.uid() or user_id = get_partner_id());
create policy "user_films_insert" on user_films for insert
  with check (user_id = auth.uid());
create policy "user_films_update" on user_films for update
  using (user_id = auth.uid());
create policy "user_films_delete" on user_films for delete
  using (user_id = auth.uid());

-- comments: read own or partner; write own only
create policy "comments_select" on comments for select
  using (user_id = auth.uid() or user_id = get_partner_id());
create policy "comments_insert" on comments for insert
  with check (user_id = auth.uid());
create policy "comments_update" on comments for update
  using (user_id = auth.uid());
create policy "comments_delete" on comments for delete
  using (user_id = auth.uid());

-- couples: both members can read; no direct client insert (handled via API route)
create policy "couples_select" on couples for select
  using (user1_id = auth.uid() or user2_id = auth.uid());

-- Trigger: auto-create profile on sign up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update updated_at on comment edits
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_comments_updated
  before update on comments
  for each row execute procedure update_updated_at();

-- Indexes for common query patterns
create index idx_user_films_user_id on user_films(user_id);
create index idx_comments_tmdb_id on comments(tmdb_id);
create index idx_profiles_couple_id on profiles(couple_id);
