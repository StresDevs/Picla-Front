create table public.audit_logs (
  id uuid not null default gen_random_uuid (),
  actor_user_id uuid null,
  branch_id uuid null,
  action text not null,
  entity_table text not null,
  entity_id uuid null,
  old_data jsonb null,
  new_data jsonb null,
  metadata jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint audit_logs_pkey primary key (id),
  constraint audit_logs_branch_id_fkey foreign KEY (branch_id) references branches (id)
) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_actor_user_id on public.audit_logs using btree (actor_user_id) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_branch_id on public.audit_logs using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_entity_table on public.audit_logs using btree (entity_table) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_created_at on public.audit_logs using btree (created_at desc) TABLESPACE pg_default;


create table public.branches (
  id uuid not null default gen_random_uuid (),
  name text not null,
  address text null,
  phone text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint branches_pkey primary key (id)
) TABLESPACE pg_default;

create trigger trg_audit_branches
after INSERT
or DELETE
or
update on branches for EACH row
execute FUNCTION audit_trigger ();

create trigger trg_branches_set_updated_at BEFORE
update on branches for EACH row
execute FUNCTION set_updated_at ();


create table public.roles (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone not null default now(),
  constraint roles_pkey primary key (id),
  constraint roles_name_key unique (name),
  constraint roles_name_allowed check (
    (
      name = any (
        array[
          'admin'::text,
          'employee'::text,
          'manager'::text,
          'read_only'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger trg_audit_roles
after INSERT
or DELETE
or
update on roles for EACH row
execute FUNCTION audit_trigger ();

create table public.user_roles (
  user_id uuid not null,
  role_id uuid not null,
  assigned_at timestamp with time zone not null default now(),
  assigned_by uuid null,
  constraint user_roles_pkey primary key (user_id, role_id),
  constraint user_roles_assigned_by_fkey foreign KEY (assigned_by) references users (id),
  constraint user_roles_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE,
  constraint user_roles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_roles_user_id on public.user_roles using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_roles_role_id on public.user_roles using btree (role_id) TABLESPACE pg_default;

create trigger trg_audit_user_roles
after INSERT
or DELETE
or
update on user_roles for EACH row
execute FUNCTION audit_trigger ();

create table public.users (
  id uuid not null,
  full_name text not null,
  phone text null,
  email text not null,
  branch_id uuid not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  role_id uuid not null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_branch_id_fkey foreign KEY (branch_id) references branches (id),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint users_role_id_fkey foreign KEY (role_id) references roles (id)
) TABLESPACE pg_default;

create index IF not exists idx_users_branch_id on public.users using btree (branch_id) TABLESPACE pg_default;

create trigger trg_audit_users
after INSERT
or DELETE
or
update on users for EACH row
execute FUNCTION audit_trigger ();

create trigger trg_users_set_updated_at BEFORE
update on users for EACH row
execute FUNCTION set_updated_at ();
