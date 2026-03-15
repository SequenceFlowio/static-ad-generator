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

-- Storage buckets (run separately in Supabase dashboard or via CLI):
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
-- insert into storage.buckets (id, name, public) values ('generated-ads', 'generated-ads', true);
