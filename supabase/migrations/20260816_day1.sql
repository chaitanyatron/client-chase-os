-- Client Chase OS: Day 1 schema. Run in the Supabase SQL Editor.
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  email text,
  phone text,
  company_name text,
  created_at timestamptz not null default now()
);

create type public.document_request_status as enum ('pending', 'received', 'overdue');
create table public.document_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  document_name text not null check (char_length(trim(document_name)) > 0),
  status public.document_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  due_date date,
  received_at timestamptz,
  constraint received_request_has_date check ((status <> 'received') or received_at is not null)
);

create index clients_owner_id_idx on public.clients(owner_id);
create index document_requests_client_id_idx on public.document_requests(client_id);
create index document_requests_status_idx on public.document_requests(status);

-- Profile creation is database-enforced so it works for email-confirmed and immediate signups.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.document_requests enable row level security;

create policy "Users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Users manage own clients" on public.clients for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Users manage own client requests" on public.document_requests for all to authenticated using (
  exists (select 1 from public.clients c where c.id = document_requests.client_id and c.owner_id = auth.uid())
) with check (
  exists (select 1 from public.clients c where c.id = document_requests.client_id and c.owner_id = auth.uid())
);
