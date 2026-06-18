-- DishCon production schema (Supabase PostgreSQL)
-- Run this file in Supabase SQL Editor before connecting the application.

create extension if not exists "pgcrypto";

-- Email pada tabel ini otomatis mendapat role admin ketika akun dibuat.
-- Isi melalui SQL Editor/service role, bukan dari client publik.
create table if not exists public.admin_email_allowlist (
  email text primary key,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  phone text,
  role text not null check (role in ('donatur','penerima','admin')),
  roles text[] not null default array['penerima']::text[],
  address text,
  organization text,
  beneficiaries integer default 0,
  avatar_url text,
  oauth_role_set_at timestamptz,
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists oauth_role_set_at timestamptz;
alter table public.profiles add column if not exists roles text[] not null default array['penerima']::text[];
alter table public.profiles drop constraint if exists profiles_roles_valid;
alter table public.profiles add constraint profiles_roles_valid check (
  roles <@ array['donatur','penerima','admin']::text[]
  and (role <> 'admin' or roles = array['admin']::text[])
  and (role = 'admin' or not ('admin' = any(roles)))
) not valid;
update public.profiles set roles = array['admin']::text[] where role = 'admin';
update public.profiles set roles = array[role]::text[] where role in ('donatur','penerima') and (roles is null or array_length(roles, 1) is null);

-- Nomor telepon tidak boleh berisi huruf.
update public.profiles
set phone = regexp_replace(coalesce(phone, ''), '[^0-9+()[[:space:]]-]', '', 'g')
where phone is not null and phone ~ '[A-Za-z]';
alter table public.profiles drop constraint if exists profiles_phone_no_letters;
alter table public.profiles add constraint profiles_phone_no_letters check (phone is null or phone = '' or phone ~ '^[0-9+()[[:space:]]-]+$') not valid;

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id) on delete cascade,
  food_name text not null,
  category text not null,
  halal boolean default true,
  description text,
  portions integer not null check (portions >= 0),
  location text not null,
  pickup_deadline timestamptz not null,
  production_time timestamptz,
  storage_method text,
  status text not null default 'pending_verification' check (status in ('draft','active','pending_verification','reserved','picked_up','completed','expired','rejected')),
  nutrition jsonb,
  expiry_risk text,
  expiry jsonb,
  image_url text,
  created_at timestamptz default now()
);

alter table public.donations add column if not exists storage_method text;
alter table public.donations add column if not exists expiry jsonb;
alter table public.donations drop constraint if exists donations_portions_check;
alter table public.donations add constraint donations_portions_check check (portions >= 0);

create table if not exists public.food_requests (
  id text primary key,
  donation_id uuid references public.donations(id) on delete set null,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  donor_id uuid references public.profiles(id) on delete set null,
  food_name text not null,
  portions integer not null check (portions > 0),
  pickup_method text not null default 'pickup' check (pickup_method = 'pickup'),
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','completed','cancelled')),
  created_at timestamptz default now()
);

-- Production flow is self-pickup only. Convert legacy delivery rows before tightening the constraint.
update public.food_requests set pickup_method = 'pickup' where pickup_method is distinct from 'pickup';
alter table public.food_requests drop constraint if exists food_requests_pickup_method_check;
alter table public.food_requests add constraint food_requests_pickup_method_check check (pickup_method = 'pickup');

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info','success','warning','system')),
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('donatur','penerima','admin')),
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','in_review','resolved')),
  created_at timestamptz default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Public registration can create one or both public roles.
-- Admin accounts must be promoted through allowlist/service role only.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text;
  requested_roles text[];
  safe_beneficiaries integer;
begin
  if exists (select 1 from public.admin_email_allowlist a where lower(a.email) = lower(new.email)) then
    requested_role := 'admin';
    requested_roles := array['admin']::text[];
  else
    requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'penerima');
    if requested_role not in ('donatur', 'penerima') then
      requested_role := 'penerima';
    end if;
    requested_roles := array[requested_role]::text[];
  end if;

  safe_beneficiaries := coalesce(nullif(new.raw_user_meta_data ->> 'beneficiaries', '')::integer, 0);

  insert into public.profiles (id, email, name, phone, role, roles, address, organization, beneficiaries, avatar_url, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    requested_role,
    requested_roles,
    coalesce(new.raw_user_meta_data ->> 'address', ''),
    coalesce(new.raw_user_meta_data ->> 'organization', ''),
    safe_beneficiaries,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role or new.roles is distinct from old.roles then
    if current_user in ('postgres', 'service_role', 'supabase_admin') or public.is_admin() then
      return new;
    end if;
    if new.role = 'admin' or old.role = 'admin' or ('admin' = any(new.roles)) or ('admin' = any(old.roles)) then
      raise exception 'Role admin hanya dapat diubah oleh administrator';
    end if;
    if coalesce(current_setting('dishcon.allow_public_role_change', true), 'false') <> 'true' then
      raise exception 'Role publik hanya dapat ditetapkan melalui alur login DishCon';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute procedure public.prevent_role_escalation();

-- Dipanggil dari login email dan callback Google OAuth.
-- Satu akun publik dapat memiliki role donatur dan penerima. Admin tetap hanya dari allowlist.
create or replace function public.set_public_active_role(p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_role not in ('donatur','penerima') then raise exception 'Invalid public role'; end if;

  if exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admin role cannot be changed from public login';
  end if;

  perform set_config('dishcon.allow_public_role_change', 'true', true);

  update public.profiles
     set role = p_role,
         roles = (
           select array_agg(distinct r)
           from unnest(coalesce(roles, array[]::text[]) || array[p_role]::text[]) as r
           where r in ('donatur','penerima')
         ),
         oauth_role_set_at = coalesce(oauth_role_set_at, now())
   where id = auth.uid()
     and role <> 'admin';
end;
$$;

create or replace function public.set_google_public_role(p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.set_public_active_role(p_role);
end;
$$;

grant execute on function public.set_public_active_role(text) to authenticated;
drop function if exists public.set_own_complaint_email_status(uuid,text,text);

grant execute on function public.set_google_public_role(text) to authenticated;

alter table public.admin_email_allowlist enable row level security;
alter table public.profiles enable row level security;
alter table public.donations enable row level security;
alter table public.food_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.complaints enable row level security;
alter table public.user_preferences enable row level security;

-- Drop policies first so this file is rerunnable.
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;
drop policy if exists "donor reads own donations" on public.donations;
drop policy if exists "donor inserts own donations" on public.donations;
drop policy if exists "donor or admin updates donations" on public.donations;
drop policy if exists "read related requests" on public.food_requests;
drop policy if exists "recipient inserts own requests" on public.food_requests;
drop policy if exists "related users update requests" on public.food_requests;
drop policy if exists "read own notifications" on public.notifications;
drop policy if exists "insert related notifications" on public.notifications;
drop policy if exists "update own notifications" on public.notifications;
drop policy if exists "read own or admin complaints" on public.complaints;
drop policy if exists "insert own complaints" on public.complaints;
drop policy if exists "admin update complaints" on public.complaints;
drop policy if exists "read own preferences" on public.user_preferences;
drop policy if exists "upsert own preferences" on public.user_preferences;
drop policy if exists "update own preferences" on public.user_preferences;

-- Profiles
create policy "read own profile" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id and role in ('donatur','penerima'));
create policy "update own profile" on public.profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

-- Donations
create policy "donor reads own donations" on public.donations for select using (
  donor_id = auth.uid()
  or status = 'active'
  or public.is_admin()
  or exists (
    select 1 from public.food_requests fr
    where fr.donation_id = donations.id and fr.recipient_id = auth.uid()
  )
);
create policy "donor inserts own donations" on public.donations for insert with check (
  donor_id = auth.uid()
  and exists(select 1 from public.profiles where id = auth.uid() and 'donatur' = any(roles))
);
create policy "donor or admin updates donations" on public.donations for update using (donor_id = auth.uid() or public.is_admin()) with check (donor_id = auth.uid() or public.is_admin());

-- Requests
create policy "read related requests" on public.food_requests for select using (recipient_id = auth.uid() or donor_id = auth.uid() or public.is_admin());
create policy "recipient inserts own requests" on public.food_requests for insert with check (
  recipient_id = auth.uid()
  and exists(select 1 from public.profiles where id = auth.uid() and role = 'penerima')
);
create policy "related users update requests" on public.food_requests for update using (recipient_id = auth.uid() or donor_id = auth.uid() or public.is_admin()) with check (recipient_id = auth.uid() or donor_id = auth.uid() or public.is_admin());

-- Atomic request status update. Saat admin menyetujui pengajuan, stok donasi langsung berkurang.
create or replace function public.set_food_request_status(p_request_id text, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.food_requests%rowtype;
  v_donation public.donations%rowtype;
  v_remaining integer;
begin
  if not public.is_admin() then
    raise exception 'Only admin can change request status';
  end if;
  if p_status not in ('pending','approved','rejected','completed','cancelled') then
    raise exception 'Invalid request status';
  end if;

  select * into v_request from public.food_requests where id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;

  if v_request.donation_id is not null then
    select * into v_donation from public.donations where id = v_request.donation_id for update;
  end if;

  if p_status = 'approved' and v_request.status <> 'approved' and v_request.donation_id is not null then
    if v_donation.status <> 'active' then
      raise exception 'Donation is not active';
    end if;
    if v_donation.portions < v_request.portions then
      raise exception 'Not enough portions. Remaining: %', v_donation.portions;
    end if;
    v_remaining := v_donation.portions - v_request.portions;
    update public.donations
       set portions = v_remaining,
           status = case when v_remaining > 0 then 'active' else 'reserved' end
     where id = v_request.donation_id;
  elsif p_status in ('rejected','cancelled') and v_request.status = 'approved' and v_request.donation_id is not null then
    update public.donations
       set portions = portions + v_request.portions,
           status = 'active'
     where id = v_request.donation_id;
  elsif p_status = 'completed' and v_request.donation_id is not null and v_donation.portions <= 0 then
    update public.donations set status = 'completed' where id = v_request.donation_id;
  end if;

  update public.food_requests set status = p_status where id = p_request_id;
end;
$$;

grant execute on function public.set_food_request_status(text,text) to authenticated;

-- Notifications
create policy "read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "insert related notifications" on public.notifications for insert with check (user_id = auth.uid() or public.is_admin());
create policy "update own notifications" on public.notifications for update using (user_id = auth.uid());

-- Complaints
create policy "read own or admin complaints" on public.complaints for select using (user_id = auth.uid() or public.is_admin());
create policy "insert own complaints" on public.complaints for insert with check (user_id = auth.uid());
create policy "admin update complaints" on public.complaints for update using (public.is_admin());

-- Preferences (used by penerima; table remains generic).
create policy "read own preferences" on public.user_preferences for select using (user_id = auth.uid());
create policy "upsert own preferences" on public.user_preferences for insert with check (user_id = auth.uid());
create policy "update own preferences" on public.user_preferences for update using (user_id = auth.uid());

-- Server-side notifications keep admin pages synchronized with new user input.
create or replace function public.notify_admins_on_donation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id,title,message,type,link)
  select id, 'Donasi baru perlu diverifikasi', new.food_name || ' sebanyak ' || new.portions || ' porsi.', 'warning', '/admin/donations'
  from public.profiles where role = 'admin';
  return new;
end; $$;

drop trigger if exists notify_admins_after_donation on public.donations;
create trigger notify_admins_after_donation after insert on public.donations for each row execute procedure public.notify_admins_on_donation();

create or replace function public.notify_related_on_request()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id,title,message,type,link)
  select id, 'Pengajuan makanan baru', new.food_name || ' sebanyak ' || new.portions || ' porsi.', 'warning', '/admin/requests'
  from public.profiles where role = 'admin';
  if new.donor_id is not null then
    insert into public.notifications (user_id,title,message,type,link)
    values (new.donor_id, 'Pengajuan untuk donasi Anda', new.food_name || ' diajukan penerima.', 'info', '/donor/dashboard');
  end if;
  return new;
end; $$;

drop trigger if exists notify_related_after_request on public.food_requests;
create trigger notify_related_after_request after insert on public.food_requests for each row execute procedure public.notify_related_on_request();

create or replace function public.notify_admins_on_complaint()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id,title,message,type,link)
  select id, 'Pengaduan baru', new.subject, 'warning', '/admin/complaints?complaint=' || new.id::text
  from public.profiles where role = 'admin' and id <> new.user_id;
  return new;
end; $$;

drop trigger if exists notify_admins_after_complaint on public.complaints;
create trigger notify_admins_after_complaint after insert on public.complaints for each row execute procedure public.notify_admins_on_complaint();

-- Public image bucket for donation photos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('donation-images', 'donation-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "donation image public read" on storage.objects;
drop policy if exists "donor uploads own images" on storage.objects;
drop policy if exists "donor updates own images" on storage.objects;
drop policy if exists "donor deletes own images" on storage.objects;

create policy "donation image public read" on storage.objects for select using (bucket_id = 'donation-images');
create policy "donor uploads own images" on storage.objects for insert with check (bucket_id = 'donation-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "donor updates own images" on storage.objects for update using (bucket_id = 'donation-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "donor deletes own images" on storage.objects for delete using (bucket_id = 'donation-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Optional profile asset bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-assets', 'profile-assets', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile asset public read" on storage.objects;
drop policy if exists "user uploads own profile assets" on storage.objects;
drop policy if exists "user updates own profile assets" on storage.objects;
drop policy if exists "user deletes own profile assets" on storage.objects;
create policy "profile asset public read" on storage.objects for select using (bucket_id = 'profile-assets');
create policy "user uploads own profile assets" on storage.objects for insert with check (bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "user updates own profile assets" on storage.objects for update using (bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "user deletes own profile assets" on storage.objects for delete using (bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text);

-- Add an email before sign-up so the account is created directly as admin:
-- insert into public.admin_email_allowlist(email) values ('admin@yourdomain.com') on conflict do nothing;
-- Promote a trusted existing account to admin after it has registered:
-- update public.profiles set role = 'admin' where email = 'admin@yourdomain.com';
