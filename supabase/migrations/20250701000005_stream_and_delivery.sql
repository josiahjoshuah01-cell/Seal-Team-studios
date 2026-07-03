-- Video stream processing status on media
alter table public.media
  add column if not exists stream_status text
  check (stream_status in ('uploading', 'processing', 'ready', 'error'));

-- Project-level video delivery tracking (Cloudflare vs WhatsApp)
alter table public.projects
  add column if not exists video_delivery_method text
  check (video_delivery_method in ('cloudflare', 'whatsapp', 'not_applicable'))
  default 'not_applicable';

alter table public.projects
  add column if not exists video_delivery_status text
  check (video_delivery_status in ('not_sent', 'sent', 'not_applicable'))
  default 'not_applicable';

alter table public.projects
  add column if not exists video_delivered_at timestamptz;

alter table public.projects
  add column if not exists video_delivery_notes text;
