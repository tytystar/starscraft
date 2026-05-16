-- ============================================================
-- Starscraft — Full Schema Migration
-- Paste this into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- QUOTES
create table if not exists public.quotes (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  name           text not null,
  email          text not null,
  model_url      text not null,
  quantity       int not null default 1,
  color          text not null default '',
  material       text not null default '',
  nfc_chip       boolean not null default false,
  customizations text,
  status         text not null default 'received',
  order_id       text not null default ''
);

-- TIME LAPSES
create table if not exists public.time_lapses (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  caption      text,
  video_url    text not null,
  material_tag text,
  color_tag    text,
  visible      boolean not null default true,
  sort_order   int not null default 0
);

-- ADMIN OPTIONS (colors & materials dropdown values)
create table if not exists public.admin_options (
  id    uuid primary key default gen_random_uuid(),
  type  text not null check (type in ('color','material')),
  label text not null,
  value text not null
);

-- REVIEWS
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null,
  rating     int not null check (rating between 1 and 5),
  comment    text not null,
  approved   boolean not null default false
);

-- FAQ
create table if not exists public.faq (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  sort_order int not null default 0
);

-- GALLERY
create table if not exists public.gallery (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  image_url  text not null,
  material   text,
  category   text,
  visible    boolean not null default true,
  sort_order int not null default 0
);

-- ── Row Level Security ────────────────────────────────────────
alter table public.quotes        enable row level security;
alter table public.time_lapses   enable row level security;
alter table public.admin_options enable row level security;
alter table public.reviews       enable row level security;
alter table public.faq           enable row level security;
alter table public.gallery       enable row level security;

-- Authenticated users (admin) can do everything
create policy if not exists auth_all on public.quotes        for all to authenticated using (true) with check (true);
create policy if not exists auth_all on public.time_lapses   for all to authenticated using (true) with check (true);
create policy if not exists auth_all on public.admin_options for all to authenticated using (true) with check (true);
create policy if not exists auth_all on public.reviews       for all to authenticated using (true) with check (true);
create policy if not exists auth_all on public.faq           for all to authenticated using (true) with check (true);
create policy if not exists auth_all on public.gallery       for all to authenticated using (true) with check (true);

-- Public (anon) can read approved/visible content
create policy if not exists public_read on public.time_lapses   for select to anon using (visible = true);
create policy if not exists public_read on public.admin_options for select to anon using (true);
create policy if not exists public_read on public.reviews       for select to anon using (approved = true);
create policy if not exists public_read on public.faq           for select to anon using (true);
create policy if not exists public_read on public.gallery       for select to anon using (visible = true);
-- Anon can INSERT quotes (quote submission form)
create policy if not exists anon_insert on public.quotes for insert to anon with check (true);
-- Anon can SELECT own quote by email (order tracking)
create policy if not exists anon_read   on public.quotes for select to anon using (true);
