alter table public.galleries
  add column if not exists published_notified_at timestamptz;
