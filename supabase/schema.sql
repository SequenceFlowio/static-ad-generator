-- SequenceFlow Static Ad Generator — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database.

-- Brands
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  url text,
  created_at timestamptz default now()
);

-- Brand DNA documents (one active per brand, upserted on re-research)
create table if not exists brand_dna (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade not null,
  content text not null,
  generated_at timestamptz default now()
);

-- Prompt sets (one per brand + product run)
create table if not exists prompt_sets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade not null,
  product_name text not null,
  prompts_json jsonb not null,
  generated_at timestamptz default now()
);

-- Generation jobs (one per template per generation run)
create table if not exists generation_jobs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade not null,
  prompt_set_id uuid references prompt_sets(id) on delete cascade,
  template_number int,
  template_name text,
  resolution text,
  status text default 'pending',
  image_urls jsonb,
  error text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists brand_dna_brand_id_idx on brand_dna(brand_id);
create index if not exists prompt_sets_brand_id_idx on prompt_sets(brand_id);
create index if not exists generation_jobs_brand_id_idx on generation_jobs(brand_id);
create index if not exists generation_jobs_prompt_set_id_idx on generation_jobs(prompt_set_id);

-- Content sessions (one per content generation run — brand-level, not product-level)
create table if not exists content_sessions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  template_name text not null,
  platform text not null,
  topic_hint text,
  selected_desire text,
  image_prompt text,
  caption text,
  image_url text,
  status text default 'draft',
  created_at timestamptz default now()
);

-- Inspo image library (per brand, split by type: 'ad' | 'content', max 20 per type)
create table if not exists inspo_images (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade not null,
  type text not null check (type in ('ad', 'content')),
  image_url text not null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists content_sessions_brand_id_idx on content_sessions(brand_id);
create index if not exists inspo_images_brand_id_type_idx on inspo_images(brand_id, type);

-- Storage buckets (run separately in Supabase dashboard or via CLI):
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
-- insert into storage.buckets (id, name, public) values ('generated-ads', 'generated-ads', true);
-- insert into storage.buckets (id, name, public) values ('inspo-images', 'inspo-images', true);
