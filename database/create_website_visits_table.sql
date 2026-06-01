-- Create the website_visits table used for visit analytics.
-- Run this in your Supabase SQL editor if the table is missing.

create table if not exists public.website_visits (
  id bigint primary key generated always as identity,
  visitor_token text,
  page_path text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists website_visits_created_at_idx on public.website_visits(created_at desc);
create index if not exists website_visits_token_idx on public.website_visits(visitor_token);
