-- Payment tracking foundation. Apply this migration in Supabase SQL Editor before deploying.
alter table public.orders
  add column if not exists payment_method text not null default 'transfer'
    check (payment_method in ('transfer', 'tunai')),
  add column if not exists payment_status text not null default 'belum_dibayar'
    check (payment_status in ('belum_dibayar', 'menunggu_verifikasi', 'dp_dibayar', 'lunas', 'gagal', 'dibatalkan')),
  add column if not exists total_amount integer
    check (total_amount is null or total_amount >= 0),
  add column if not exists dp_percent integer not null default 50
    check (dp_percent between 0 and 100),
  add column if not exists dp_amount integer
    check (dp_amount is null or dp_amount >= 0),
  add column if not exists payment_note text;

create table if not exists public.payment_settings (
  id integer primary key default 1 check (id = 1),
  dp_percent integer not null default 50 check (dp_percent between 0 and 100),
  updated_at timestamptz not null default now()
);
insert into public.payment_settings (id, dp_percent)
values (1, 50)
on conflict (id) do nothing;

alter table public.payment_settings enable row level security;
grant select, insert, update on public.payment_settings to authenticated;
grant all on public.payment_settings to service_role;
create policy "Admins can read payment settings" on public.payment_settings
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can insert payment settings" on public.payment_settings
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update payment settings" on public.payment_settings
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Existing orders remain payment-unconfirmed until reviewed by an admin.
