-- Seed script: run manually after creating an admin user in Supabase Auth
-- Replace YOUR_ADMIN_USER_UUID with the auth.users id from the dashboard

-- Example: promote a user to admin
-- update public.profiles set role = 'admin' where id = 'YOUR_ADMIN_USER_UUID';

-- Sample services
insert into public.services (name, description, price, duration_minutes, is_active)
values
  ('Portrait Session', '1-hour studio or outdoor portrait session', 15000, 60, true),
  ('Wedding Coverage', 'Full-day wedding photography and video', 150000, 480, true),
  ('Commercial Shoot', 'Product or brand content half-day', 45000, 240, true)
on conflict do nothing;
