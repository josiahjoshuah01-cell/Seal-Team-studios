-- Invoice payment fields and manual payment method

alter table public.invoices
  add column if not exists description text,
  add column if not exists mpesa_checkout_request_id text;

alter table public.invoices
  drop constraint if exists invoices_payment_method_check;

alter table public.invoices
  add constraint invoices_payment_method_check
  check (payment_method in ('paypal', 'mpesa', 'manual'));

create index if not exists idx_invoices_project_id on public.invoices(project_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_mpesa_checkout_request_id
  on public.invoices(mpesa_checkout_request_id)
  where mpesa_checkout_request_id is not null;
