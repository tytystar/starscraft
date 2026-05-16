-- Run this in your Supabase SQL editor to set up the database

-- Quotes (customer order submissions)
create table quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  order_id text unique not null,
  name text not null,
  email text not null,
  model_url text not null,
  quantity int not null default 1,
  color text not null,
  material text not null,
  nfc_chip boolean default false,
  customizations text,
  status text not null default 'received'
);

-- Admin-managed dropdown options (colors and materials)
create table admin_options (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('color', 'material')),
  label text not null,
  value text not null
);

-- Seed some default options
insert into admin_options (type, label, value) values
  ('color', 'Matte Black', 'matte-black'),
  ('color', 'Matte White', 'matte-white'),
  ('color', 'Galaxy Blue', 'galaxy-blue'),
  ('color', 'Flame Orange', 'flame-orange'),
  ('color', 'Forest Green', 'forest-green'),
  ('material', 'PLA (Standard)', 'pla'),
  ('material', 'PETG (Durable)', 'petg'),
  ('material', 'TPU (Flexible)', 'tpu'),
  ('material', 'Resin (High Detail)', 'resin');

-- Time lapse videos (admin-managed)
create table time_lapses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text,
  video_url text not null,
  material_tag text,
  color_tag text,
  visible boolean default true,
  sort_order int default 0
);

-- Gallery (admin-managed past prints)
create table gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  material text,
  category text,
  visible boolean default true,
  sort_order int default 0
);

-- FAQ (admin-managed)
create table faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int default 0
);

-- Seed default FAQ
insert into faq (question, answer, sort_order) values
  ('How long does printing take?', 'Most prints are completed within 3–7 business days depending on complexity, material, and quantity. We will update you by email at each stage.', 0),
  ('What materials do you offer?', 'We currently offer PLA (standard), PETG (durable/water-resistant), TPU (flexible), and Resin (high detail). Available options are shown in the quote form.', 1),
  ('What is an NFC chip and should I add one?', 'An NFC chip is a small programmable chip embedded in your print. Tap it with any smartphone to open a link, contact card, or custom action. Great for business cards, display pieces, or smart home tokens.', 2),
  ('What if my print fails or has defects?', 'Every print goes through a quality check before shipping. If something does not meet our standards we reprint it at no charge. Contact us with your order ID if you have concerns after delivery.', 3),
  ('Can I submit models from sites other than MakerWorld?', 'MakerWorld is our recommended source because it has strong licensing information. You may submit links from other sites but you are responsible for confirming you have the right to print the model.', 4);

-- Reviews (customer-submitted, admin-approved)
create table reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  approved boolean default false
);

-- Enable Row Level Security and set public read policies
alter table quotes enable row level security;
alter table admin_options enable row level security;
alter table time_lapses enable row level security;
alter table gallery enable row level security;
alter table faq enable row level security;
alter table reviews enable row level security;

-- Public can read options, time lapses, gallery, faq, approved reviews
create policy "public read admin_options" on admin_options for select using (true);
create policy "public read time_lapses" on time_lapses for select using (visible = true);
create policy "public read gallery" on gallery for select using (visible = true);
create policy "public read faq" on faq for select using (true);
create policy "public read reviews" on reviews for select using (approved = true);

-- Public can insert quotes and reviews
create policy "public insert quotes" on quotes for insert with check (true);
create policy "public insert reviews" on reviews for insert with check (true);

-- Public can read their own quote by order_id
create policy "public read own quote" on quotes for select using (true);

-- Full access for service role (used by admin dashboard)
create policy "service role full quotes" on quotes for all using (true);
create policy "service role full admin_options" on admin_options for all using (true);
create policy "service role full time_lapses" on time_lapses for all using (true);
create policy "service role full gallery" on gallery for all using (true);
create policy "service role full faq" on faq for all using (true);
create policy "service role full reviews" on reviews for all using (true);
