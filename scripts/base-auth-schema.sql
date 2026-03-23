-- Base schema para Supabase Auth + gestión de usuarios
-- Incluye: roles, branches, users, user_roles y auditoría.

create extension if not exists pgcrypto;

-- =========================
-- 1) TABLAS PRINCIPALES
-- =========================

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  constraint roles_name_allowed check (name in ('admin', 'employee')),
  created_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Perfil de empleado enlazado a Auth de Supabase.
-- auth.users almacena credenciales; esta tabla datos de negocio.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  email text not null unique,
  role_id uuid not null references public.roles(id),
  branch_id uuid not null references public.branches(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Relación muchos-a-muchos por flexibilidad futura.
create table if not exists public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.users(id),
  primary key (user_id, role_id)
);

-- =========================
-- 2) AUDITORÍA
-- =========================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  branch_id uuid references public.branches(id),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_branch_id on public.users(branch_id);
create index if not exists idx_users_role_id on public.users(role_id);
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_role_id on public.user_roles(role_id);
create index if not exists idx_audit_logs_actor_user_id on public.audit_logs(actor_user_id);
create index if not exists idx_audit_logs_branch_id on public.audit_logs(branch_id);
create index if not exists idx_audit_logs_entity_table on public.audit_logs(entity_table);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'roles'
      and constraint_name = 'roles_name_allowed'
  ) then
    alter table public.roles drop constraint roles_name_allowed;
  end if;

  alter table public.roles
    add constraint roles_name_allowed check (name in ('admin', 'employee'));
end;
$$;

insert into public.roles (name)
values ('admin'), ('employee')
on conflict (name) do nothing;

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_branches_set_updated_at on public.branches;
create trigger trg_branches_set_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- Auditoría genérica por trigger.
-- Nota: actor_user_id usa JWT de Supabase cuando está disponible.
create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_branch uuid;
begin
  begin
    v_actor := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  exception
    when others then
      v_actor := null;
  end;

  if tg_table_name = 'users' then
    v_branch := coalesce(new.branch_id, old.branch_id);
  elsif tg_table_name = 'branches' then
    v_branch := coalesce(new.id, old.id);
  else
    v_branch := null;
  end if;

  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_user_id, branch_id, action, entity_table, entity_id, old_data, new_data)
    values (v_actor, v_branch, 'insert', tg_table_name, new.id, null, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs (actor_user_id, branch_id, action, entity_table, entity_id, old_data, new_data)
    values (v_actor, v_branch, 'update', tg_table_name, new.id, to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs (actor_user_id, branch_id, action, entity_table, entity_id, old_data, new_data)
    values (v_actor, v_branch, 'delete', tg_table_name, old.id, to_jsonb(old), null);
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_audit_users on public.users;
create trigger trg_audit_users
after insert or update or delete on public.users
for each row execute function public.audit_trigger();

drop trigger if exists trg_audit_roles on public.roles;
create trigger trg_audit_roles
after insert or update or delete on public.roles
for each row execute function public.audit_trigger();

drop trigger if exists trg_audit_branches on public.branches;
create trigger trg_audit_branches
after insert or update or delete on public.branches
for each row execute function public.audit_trigger();

drop trigger if exists trg_audit_user_roles on public.user_roles;
create trigger trg_audit_user_roles
after insert or update or delete on public.user_roles
for each row execute function public.audit_trigger();

-- =========================
-- 3) RLS BÁSICO (arranque)
-- =========================

alter table public.roles enable row level security;
alter table public.branches enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    join public.roles r on r.id = u.role_id
    where u.id = p_user_id
      and u.is_active = true
      and r.name = 'admin'
  );
$$;

-- Lectura base para usuarios autenticados.
drop policy if exists roles_select_authenticated on public.roles;
create policy roles_select_authenticated
on public.roles
for select
to authenticated
using (true);

drop policy if exists branches_select_authenticated on public.branches;
create policy branches_select_authenticated
on public.branches
for select
to authenticated
using (true);

drop policy if exists branches_insert_admin on public.branches;
create policy branches_insert_admin
on public.branches
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists branches_update_admin on public.branches;
create policy branches_update_admin
on public.branches
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists branches_delete_admin on public.branches;
create policy branches_delete_admin
on public.branches
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- Usuarios: admin crea y administra; employee solo ve su perfil.
drop policy if exists users_select_own on public.users;
create policy users_select_own
on public.users
for select
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists users_insert_admin on public.users;
create policy users_insert_admin
on public.users
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists users_update_own on public.users;
create policy users_update_own
on public.users
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists users_delete_admin on public.users;
create policy users_delete_admin
on public.users
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- Relación M:N visible por dueño.
drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own
on public.user_roles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists user_roles_insert_admin on public.user_roles;
create policy user_roles_insert_admin
on public.user_roles
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists user_roles_update_admin on public.user_roles;
create policy user_roles_update_admin
on public.user_roles
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists user_roles_delete_admin on public.user_roles;
create policy user_roles_delete_admin
on public.user_roles
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- Auditoría visible solo por service_role (backend seguro).
drop policy if exists audit_logs_service_role_only on public.audit_logs;
create policy audit_logs_service_role_only
on public.audit_logs
for all
to service_role
using (true)
with check (true);
