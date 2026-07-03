-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.availability enable row level security;
alter table public.bookings enable row level security;
alter table public.projects enable row level security;
alter table public.galleries enable row level security;
alter table public.media enable row level security;
alter table public.invoices enable row level security;
alter table public.blog_posts enable row level security;
alter table public.error_logs enable row level security;

-- =====================
-- PROFILES
-- =====================
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- =====================
-- CLIENTS
-- =====================
create policy "Clients can read own client record"
  on public.clients for select
  using (profile_id = auth.uid());

create policy "Admins have full access to clients"
  on public.clients for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================
-- SERVICES
-- =====================
create policy "Anyone can read active services"
  on public.services for select
  using (is_active = true or public.is_admin());

create policy "Admins can manage services"
  on public.services for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================
-- AVAILABILITY
-- =====================
create policy "Anyone can read availability"
  on public.availability for select
  using (true);

create policy "Admins can manage availability"
  on public.availability for all
  using (public.is_admin())
  with check (public.is_admin());

-- Allow anonymous/authenticated users to create pending bookings via availability
-- (bookings insert handled separately)

-- =====================
-- BOOKINGS
-- =====================
create policy "Clients can read own bookings"
  on public.bookings for select
  using (client_id = public.current_client_id());

create policy "Clients can create own bookings"
  on public.bookings for insert
  with check (client_id = public.current_client_id() or client_id is null);

create policy "Admins have full access to bookings"
  on public.bookings for all
  using (public.is_admin())
  with check (public.is_admin());

-- Public booking flow: allow anon insert for pending bookings (no client_id yet)
create policy "Anyone can submit booking request"
  on public.bookings for insert
  with check (status = 'pending');

create policy "Anyone can read own pending booking by id"
  on public.bookings for select
  using (status = 'pending' and client_id is null);

-- =====================
-- PROJECTS
-- =====================
create policy "Clients can read own projects"
  on public.projects for select
  using (client_id = public.current_client_id());

create policy "Admins have full access to projects"
  on public.projects for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================
-- GALLERIES
-- =====================
create policy "Clients can read own non-expired galleries"
  on public.galleries for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = galleries.project_id
        and p.client_id = public.current_client_id()
    )
    and (expires_at is null or expires_at > now())
  );

create policy "Public can read public galleries"
  on public.galleries for select
  using (is_public = true and (expires_at is null or expires_at > now()));

create policy "Admins have full access to galleries"
  on public.galleries for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================
-- MEDIA
-- =====================
create policy "Clients can read media in own galleries"
  on public.media for select
  using (
    exists (
      select 1 from public.galleries g
      join public.projects p on p.id = g.project_id
      where g.id = media.gallery_id
        and p.client_id = public.current_client_id()
        and (g.expires_at is null or g.expires_at > now())
    )
  );

create policy "Public can read media in public galleries"
  on public.media for select
  using (
    exists (
      select 1 from public.galleries g
      where g.id = media.gallery_id
        and g.is_public = true
        and (g.expires_at is null or g.expires_at > now())
    )
  );

create policy "Clients can update favorites on own media"
  on public.media for update
  using (
    exists (
      select 1 from public.galleries g
      join public.projects p on p.id = g.project_id
      where g.id = media.gallery_id
        and p.client_id = public.current_client_id()
    )
  )
  with check (
    exists (
      select 1 from public.galleries g
      join public.projects p on p.id = g.project_id
      where g.id = media.gallery_id
        and p.client_id = public.current_client_id()
    )
  );

create policy "Admins have full access to media"
  on public.media for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================
-- INVOICES
-- =====================
create policy "Clients can read own invoices"
  on public.invoices for select
  using (client_id = public.current_client_id());

create policy "Admins have full access to invoices"
  on public.invoices for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================
-- BLOG POSTS
-- =====================
create policy "Anyone can read published blog posts"
  on public.blog_posts for select
  using (is_published = true);

create policy "Admins can manage blog posts"
  on public.blog_posts for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================
-- ERROR LOGS — no client/anon access (service role only)
-- =====================
-- No policies = only service role bypasses RLS

-- =====================
-- STORAGE (gallery images bucket)
-- =====================
insert into storage.buckets (id, name, public)
values ('gallery-media', 'gallery-media', false)
on conflict (id) do nothing;

create policy "Admins can upload gallery media"
  on storage.objects for insert
  with check (
    bucket_id = 'gallery-media'
    and public.is_admin()
  );

create policy "Admins can update gallery media"
  on storage.objects for update
  using (bucket_id = 'gallery-media' and public.is_admin());

create policy "Admins can delete gallery media"
  on storage.objects for delete
  using (bucket_id = 'gallery-media' and public.is_admin());

create policy "Clients can read own gallery media"
  on storage.objects for select
  using (
    bucket_id = 'gallery-media'
    and (
      public.is_admin()
      or exists (
        select 1 from public.media m
        join public.galleries g on g.id = m.gallery_id
        join public.projects p on p.id = g.project_id
        where p.client_id = public.current_client_id()
          and m.storage_path = storage.objects.name
      )
    )
  );
