-- Enable required extensions
create extension if not exists "pgcrypto";

-- Shared updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'client' check (role in ('admin', 'client')),
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();

-- Services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric,
  duration_minutes integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger services_updated_at
  before update on public.services
  for each row execute function public.handle_updated_at();

-- Availability
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger availability_updated_at
  before update on public.availability
  for each row execute function public.handle_updated_at();

-- Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  availability_id uuid references public.availability(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.handle_updated_at();

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  title text not null,
  type text,
  shoot_date date,
  status text not null default 'upcoming' check (status in ('upcoming','shot','editing','delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- Galleries
create table public.galleries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  is_public boolean not null default false,
  cover_media_id uuid,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger galleries_updated_at
  before update on public.galleries
  for each row execute function public.handle_updated_at();

-- Media
create table public.media (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references public.galleries(id) on delete cascade,
  type text not null check (type in ('image','video')),
  storage_path text,
  cloudflare_stream_uid text,
  thumbnail_url text,
  is_favorite boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger media_updated_at
  before update on public.media
  for each row execute function public.handle_updated_at();

-- Add FK for cover_media_id after media table exists
alter table public.galleries
  add constraint galleries_cover_media_id_fkey
  foreign key (cover_media_id) references public.media(id) on delete set null;

-- Invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  amount numeric not null,
  currency text not null default 'KES',
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  payment_method text check (payment_method in ('paypal','mpesa')),
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function public.handle_updated_at();

-- Blog posts
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text,
  cover_image_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.handle_updated_at();

-- Error logs
create table public.error_logs (
  id uuid primary key default gen_random_uuid(),
  source text,
  message text,
  stack text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger error_logs_updated_at
  before update on public.error_logs
  for each row execute function public.handle_updated_at();

-- Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: get client_id for current user
create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.clients
  where profile_id = auth.uid()
  limit 1;
$$;

-- Indexes
create index idx_clients_profile_id on public.clients(profile_id);
create index idx_bookings_client_id on public.bookings(client_id);
create index idx_projects_client_id on public.projects(client_id);
create index idx_galleries_project_id on public.galleries(project_id);
create index idx_media_gallery_id on public.media(gallery_id);
create index idx_invoices_client_id on public.invoices(client_id);
create index idx_blog_posts_slug on public.blog_posts(slug);
create index idx_availability_date on public.availability(date);
