-- Supabase Schema for DriveOwn Rent-to-Own Vehicle Platform
-- Created for Supabase Project: jzeezibzydgituzolvrq
-- Database: postgresql

-- STORAGE SETUP REQUIRED:
-- Create a public storage bucket named 'vehicle-images' in Supabase Dashboard > Storage
-- This bucket will store uploaded vehicle images

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Vehicles Table
create table if not exists public.vehicles (
  id bigint primary key generated always as identity,
  name varchar(100) not null,
  type varchar(50) not null,
  engine_capacity varchar(50),
  year integer,
  fuel_type varchar(50),
  transmission varchar(50),
  mileage varchar(50),
  price decimal(12,2) not null,
  monthly_payment decimal(10,2) not null,
  description text,
  status text default 'available' check (status in ('available', 'rented', 'sold')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Vehicle Images Table
create table if not exists public.vehicle_images (
  id bigint primary key generated always as identity,
  vehicle_id bigint not null references public.vehicles(id) on delete cascade,
  image_url varchar(255) not null,
  is_primary boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Applications Table
create table if not exists public.applications (
  id bigint primary key generated always as identity,
  application_number varchar(50) not null unique,
  vehicle_id bigint not null references public.vehicles(id),
  
  -- Personal Information
  first_name varchar(100) not null,
  surname varchar(100) not null,
  national_id varchar(50) not null,
  dob date not null,
  occupation varchar(100),
  residential_address text,
  marital_status varchar(30),
  gender varchar(20),
  religion varchar(50),
  contact_number varchar(30) not null,
  
  -- Next of Kin
  kin_name varchar(100),
  kin_surname varchar(100),
  kin_contact varchar(30),
  kin_address text,
  document_url varchar(255),

  -- Status
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_fee_paid boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.website_visits (
  id bigint primary key generated always as identity,
  visitor_token text,
  page_path text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists website_visits_created_at_idx on public.website_visits(created_at desc);
create index if not exists website_visits_token_idx on public.website_visits(visitor_token);

-- Create indexes for better query performance
create index if not exists vehicles_status_idx on public.vehicles(status);
create index if not exists vehicles_type_idx on public.vehicles(type);
create index if not exists vehicle_images_vehicle_id_idx on public.vehicle_images(vehicle_id);
create index if not exists applications_vehicle_id_idx on public.applications(vehicle_id);
create index if not exists applications_status_idx on public.applications(status);
create index if not exists applications_created_at_idx on public.applications(created_at desc);
create unique index if not exists applications_application_number_idx on public.applications(application_number);

-- Testimonials Table
create table if not exists public.testimonials (
  id bigint primary key generated always as identity,
  name varchar(100) not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  status text default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists testimonials_status_idx on public.testimonials(status);
create index if not exists testimonials_created_at_idx on public.testimonials(created_at desc);

-- Sample Data - Vehicles
insert into public.vehicles (name, type, engine_capacity, year, fuel_type, transmission, mileage, price, monthly_payment, description) 
values 
('Toyota Corolla', 'Sedan', '1.8L', 2022, 'Petrol', 'Automatic', '5000', 18000.00, 500.00, 'Reliable and fuel-efficient sedan, perfect for daily commuting.'),
('Honda CR-V', 'SUV', '2.0L', 2023, 'Petrol', 'Automatic', '2000', 32000.00, 889.00, 'Spacious SUV with advanced safety features and great performance.'),
('Ford Ranger', 'Truck', '3.2L', 2022, 'Diesel', 'Manual', '8000', 28000.00, 778.00, 'Powerful pickup truck ideal for both work and leisure.'),
('Volkswagen Golf', 'Hatchback', '1.4L', 2023, 'Petrol', 'Automatic', '3000', 22000.00, 611.00, 'Iconic hatchback with sporty design and excellent handling.'),
('Nissan Altima', 'Sedan', '2.5L', 2022, 'Petrol', 'CVT', '6000', 25000.00, 694.00, 'Comfortable and stylish sedan with advanced tech features.'),
('Hyundai Tucson', 'SUV', '2.0L', 2023, 'Diesel', 'Automatic', '1500', 29000.00, 806.00, 'Modern SUV with elegant design and premium interior.'),
('Chevrolet Silverado', 'Truck', '5.3L', 2021, 'Petrol', 'Automatic', '12000', 35000.00, 972.00, 'Heavy-duty truck with exceptional towing capacity.'),
('BMW 3 Series', 'Sedan', '2.0L', 2023, 'Petrol', 'Automatic', '1000', 42000.00, 1167.00, 'Luxury sports sedan with powerful engine and premium features.')
on conflict do nothing;

-- Sample Data - Vehicle Images
insert into public.vehicle_images (vehicle_id, image_url, is_primary)
values
(1, 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=600', true),
(1, 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=600', false),
(2, 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600', true),
(2, 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600', false),
(3, 'https://images.unsplash.com/photo-1583267746897-2cf415887172?w=600', true),
(3, 'https://images.unsplash.com/photo-1583267746897-2cf415887172?w=600', false),
(4, 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600', true),
(4, 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600', false),
(5, 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600', true),
(5, 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600', false),
(6, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600', true),
(6, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600', false),
(7, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600', true),
(7, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600', false),
(8, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600', true),
(8, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600', false)
on conflict do nothing;

-- Enable Row Level Security (Optional - for security)
alter table public.vehicles disable row level security;
alter table public.vehicle_images disable row level security;
alter table public.applications disable row level security;

-- Create policies for public read access to vehicles (if RLS is enabled)
-- create policy "Allow public read access to vehicles" on public.vehicles
--   for select using (true);

-- create policy "Allow public read access to vehicle_images" on public.vehicle_images
--   for select using (true);