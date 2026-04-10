-- public.branches definition

-- Drop table

-- DROP TABLE public.branches;

CREATE TABLE public.branches (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	address text NULL,
	phone text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT branches_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_branches_address_trgm ON public.branches USING gin (address gin_trgm_ops);
CREATE INDEX idx_branches_created_at_desc ON public.branches USING btree (created_at DESC);
CREATE INDEX idx_branches_name_trgm ON public.branches USING gin (name gin_trgm_ops);
CREATE UNIQUE INDEX idx_branches_name_unique_ci ON public.branches USING btree (lower(TRIM(BOTH FROM name)));
CREATE INDEX idx_branches_updated_at_desc ON public.branches USING btree (updated_at DESC);

-- Table Triggers

create trigger trg_audit_branches after
insert
    or
delete
    or
update
    on
    public.branches for each row execute function audit_trigger();
create trigger trg_branches_set_updated_at before
update
    on
    public.branches for each row execute function set_updated_at();


-- public.roles definition

-- Drop table

-- DROP TABLE public.roles;

CREATE TABLE public.roles (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT roles_name_allowed CHECK ((name = ANY (ARRAY['admin'::text, 'employee'::text, 'manager'::text, 'read_only'::text]))),
	CONSTRAINT roles_name_key UNIQUE (name),
	CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_roles_name ON public.roles USING btree (name);

-- Table Triggers

create trigger trg_audit_roles after
insert
    or
delete
    or
update
    on
    public.roles for each row execute function audit_trigger();


-- public.audit_logs definition

-- Drop table

-- DROP TABLE public.audit_logs;

CREATE TABLE public.audit_logs (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	actor_user_id uuid NULL,
	branch_id uuid NULL,
	"action" text NOT NULL,
	entity_table text NOT NULL,
	entity_id uuid NULL,
	old_data jsonb NULL,
	new_data jsonb NULL,
	metadata jsonb NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
	CONSTRAINT audit_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);
CREATE INDEX idx_audit_logs_actor_user_id ON public.audit_logs USING btree (actor_user_id);
CREATE INDEX idx_audit_logs_branch_id ON public.audit_logs USING btree (branch_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX idx_audit_logs_entity_table ON public.audit_logs USING btree (entity_table);


-- public.inventory_categories definition

-- Drop table

-- DROP TABLE public.inventory_categories;

CREATE TABLE public.inventory_categories (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	branch_id uuid NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT inventory_categories_branch_id_name_key UNIQUE (branch_id, name),
	CONSTRAINT inventory_categories_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_categories_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE
);
CREATE INDEX idx_inventory_categories_branch_id ON public.inventory_categories USING btree (branch_id);
CREATE INDEX idx_inventory_categories_name ON public.inventory_categories USING btree (name);

-- Table Triggers

create trigger trg_audit_inventory_categories after
insert
    or
delete
    or
update
    on
    public.inventory_categories for each row execute function audit_trigger();
create trigger trg_inventory_categories_set_updated_at before
update
    on
    public.inventory_categories for each row execute function set_updated_at();


-- public.inventory definition

-- Drop table

-- DROP TABLE public.inventory;

CREATE TABLE public.inventory (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	part_id uuid NOT NULL,
	branch_id uuid NOT NULL,
	quantity numeric(12, 3) DEFAULT 0 NOT NULL,
	min_quantity numeric(12, 3) DEFAULT 0 NOT NULL,
	last_restock timestamptz NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT inventory_min_quantity_check CHECK ((min_quantity >= (0)::numeric)),
	CONSTRAINT inventory_part_id_branch_id_key UNIQUE (part_id, branch_id),
	CONSTRAINT inventory_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_quantity_check CHECK ((quantity >= (0)::numeric))
);
CREATE INDEX idx_inventory_branch_id ON public.inventory USING btree (branch_id);
CREATE INDEX idx_inventory_part_id ON public.inventory USING btree (part_id);
CREATE INDEX idx_inventory_quantity ON public.inventory USING btree (quantity);

-- Table Triggers

create trigger trg_audit_inventory after
insert
    or
delete
    or
update
    on
    public.inventory for each row execute function audit_trigger();
create trigger trg_inventory_set_updated_at before
update
    on
    public.inventory for each row execute function set_updated_at();


-- public.inventory_control_records definition

-- Drop table

-- DROP TABLE public.inventory_control_records;

CREATE TABLE public.inventory_control_records (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	branch_id uuid NOT NULL,
	part_id uuid NOT NULL,
	counted_quantity numeric(12, 3) NOT NULL,
	system_quantity numeric(12, 3) NOT NULL,
	difference_quantity numeric(12, 3) NOT NULL,
	control_reason text NULL,
	notes text NULL,
	recorded_by uuid NULL,
	recorded_at timestamptz DEFAULT now() NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT inventory_control_records_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_inventory_control_records_branch ON public.inventory_control_records USING btree (branch_id);
CREATE INDEX idx_inventory_control_records_part ON public.inventory_control_records USING btree (part_id);
CREATE INDEX idx_inventory_control_records_recorded_at ON public.inventory_control_records USING btree (recorded_at DESC);

-- Table Triggers

create trigger trg_audit_inventory_control_records after
insert
    or
delete
    or
update
    on
    public.inventory_control_records for each row execute function audit_trigger();


-- public.inventory_entries definition

-- Drop table

-- DROP TABLE public.inventory_entries;

CREATE TABLE public.inventory_entries (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	branch_id uuid NOT NULL,
	part_id uuid NOT NULL,
	quantity numeric(12, 3) NOT NULL,
	unit_cost numeric(12, 2) NULL,
	unit_price numeric(12, 2) NULL,
	currency text DEFAULT 'BOB'::text NOT NULL,
	exchange_rate numeric(12, 6) NULL,
	source_reference text NULL,
	supplier_name text NULL,
	reason text NOT NULL,
	notes text NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT inventory_entries_currency_check CHECK ((currency = ANY (ARRAY['BOB'::text, 'USD'::text]))),
	CONSTRAINT inventory_entries_exchange_rate_check CHECK (((currency = 'BOB'::text) OR ((currency = 'USD'::text) AND (exchange_rate IS NOT NULL) AND (exchange_rate > (0)::numeric)))),
	CONSTRAINT inventory_entries_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_entries_quantity_check CHECK ((quantity > (0)::numeric)),
	CONSTRAINT inventory_entries_unit_cost_check CHECK (((unit_cost IS NULL) OR (unit_cost >= (0)::numeric))),
	CONSTRAINT inventory_entries_unit_price_check CHECK (((unit_price IS NULL) OR (unit_price >= (0)::numeric)))
);
CREATE INDEX idx_inventory_entries_branch_id ON public.inventory_entries USING btree (branch_id);
CREATE INDEX idx_inventory_entries_created_at ON public.inventory_entries USING btree (created_at DESC);
CREATE INDEX idx_inventory_entries_part_id ON public.inventory_entries USING btree (part_id);

-- Table Triggers

create trigger trg_audit_inventory_entries after
insert
    or
delete
    or
update
    on
    public.inventory_entries for each row execute function audit_trigger();


-- public.inventory_exits definition

-- Drop table

-- DROP TABLE public.inventory_exits;

CREATE TABLE public.inventory_exits (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	branch_id uuid NOT NULL,
	part_id uuid NOT NULL,
	quantity numeric(12, 3) NOT NULL,
	reason text NOT NULL,
	source_reference text NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT inventory_exits_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_exits_quantity_check CHECK ((quantity > (0)::numeric))
);
CREATE INDEX idx_inventory_exits_branch ON public.inventory_exits USING btree (branch_id);
CREATE INDEX idx_inventory_exits_created_at ON public.inventory_exits USING btree (created_at DESC);
CREATE INDEX idx_inventory_exits_part ON public.inventory_exits USING btree (part_id);

-- Table Triggers

create trigger trg_audit_inventory_exits after
insert
    or
delete
    or
update
    on
    public.inventory_exits for each row execute function audit_trigger();


-- public.inventory_movement_history definition

-- Drop table

-- DROP TABLE public.inventory_movement_history;

CREATE TABLE public.inventory_movement_history (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	branch_id uuid NOT NULL,
	part_id uuid NOT NULL,
	movement_type text NOT NULL,
	quantity numeric(12, 3) NOT NULL,
	quantity_before numeric(12, 3) NOT NULL,
	quantity_after numeric(12, 3) NOT NULL,
	reason text NOT NULL,
	reference_table text NULL,
	reference_id uuid NULL,
	created_by uuid NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT inventory_movement_history_after_non_negative CHECK ((quantity_after >= (0)::numeric)),
	CONSTRAINT inventory_movement_history_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_movement_history_quantity_check CHECK ((quantity > (0)::numeric)),
	CONSTRAINT inventory_movement_history_type_check CHECK ((movement_type = ANY (ARRAY['salida_ajuste'::text, 'traspaso_salida'::text, 'traspaso_ingreso'::text, 'anulacion'::text, 'devolucion'::text, 'reposicion'::text, 'ajuste_manual'::text, 'ingreso_restock'::text])))
);
CREATE INDEX idx_inventory_movement_history_branch ON public.inventory_movement_history USING btree (branch_id);
CREATE INDEX idx_inventory_movement_history_created_at ON public.inventory_movement_history USING btree (created_at DESC);
CREATE INDEX idx_inventory_movement_history_part ON public.inventory_movement_history USING btree (part_id);
CREATE INDEX idx_inventory_movement_history_reference ON public.inventory_movement_history USING btree (reference_table, reference_id);

-- Table Triggers

create trigger trg_audit_inventory_movement_history after
insert
    or
delete
    or
update
    on
    public.inventory_movement_history for each row execute function audit_trigger();


-- public.inventory_return_settings definition

-- Drop table

-- DROP TABLE public.inventory_return_settings;

CREATE TABLE public.inventory_return_settings (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	branch_id uuid NOT NULL,
	return_window_days int4 DEFAULT 7 NOT NULL,
	created_by uuid NULL,
	updated_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT inventory_return_settings_branch_id_key UNIQUE (branch_id),
	CONSTRAINT inventory_return_settings_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_return_settings_window_check CHECK ((return_window_days >= 1))
);
CREATE INDEX idx_inventory_return_settings_branch_id ON public.inventory_return_settings USING btree (branch_id);

-- Table Triggers

create trigger trg_audit_inventory_return_settings after
insert
    or
delete
    or
update
    on
    public.inventory_return_settings for each row execute function audit_trigger();
create trigger trg_inventory_return_settings_set_updated_at before
update
    on
    public.inventory_return_settings for each row execute function set_updated_at();


-- public.inventory_transfer_action_history definition

-- Drop table

-- DROP TABLE public.inventory_transfer_action_history;

CREATE TABLE public.inventory_transfer_action_history (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	transfer_id uuid NOT NULL,
	action_type text NOT NULL,
	reason text NULL,
	performed_by uuid NULL,
	details jsonb DEFAULT '{}'::jsonb NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT inventory_transfer_action_history_action_check CHECK ((action_type = ANY (ARRAY['creado'::text, 'completado'::text, 'anulacion'::text, 'devolucion'::text, 'reposicion'::text]))),
	CONSTRAINT inventory_transfer_action_history_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_inventory_transfer_action_history_created_at ON public.inventory_transfer_action_history USING btree (created_at DESC);
CREATE INDEX idx_inventory_transfer_action_history_transfer ON public.inventory_transfer_action_history USING btree (transfer_id);

-- Table Triggers

create trigger trg_audit_inventory_transfer_action_history after
insert
    or
delete
    or
update
    on
    public.inventory_transfer_action_history for each row execute function audit_trigger();


-- public.inventory_transfer_request_items definition

-- Drop table

-- DROP TABLE public.inventory_transfer_request_items;

CREATE TABLE public.inventory_transfer_request_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	transfer_id uuid NOT NULL,
	part_id uuid NOT NULL,
	quantity numeric(12, 3) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	destination_part_id uuid NULL,
	CONSTRAINT inventory_transfer_request_items_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_transfer_request_items_quantity_check CHECK ((quantity > (0)::numeric)),
	CONSTRAINT inventory_transfer_request_items_transfer_id_part_id_key UNIQUE (transfer_id, part_id)
);
CREATE INDEX idx_inventory_transfer_request_items_destination_part ON public.inventory_transfer_request_items USING btree (destination_part_id);
CREATE INDEX idx_inventory_transfer_request_items_part ON public.inventory_transfer_request_items USING btree (part_id);
CREATE INDEX idx_inventory_transfer_request_items_transfer ON public.inventory_transfer_request_items USING btree (transfer_id);

-- Table Triggers

create trigger trg_audit_inventory_transfer_request_items after
insert
    or
delete
    or
update
    on
    public.inventory_transfer_request_items for each row execute function audit_trigger();
create trigger trg_inventory_transfer_request_items_set_updated_at before
update
    on
    public.inventory_transfer_request_items for each row execute function set_updated_at();


-- public.inventory_transfer_requests definition

-- Drop table

-- DROP TABLE public.inventory_transfer_requests;

CREATE TABLE public.inventory_transfer_requests (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	from_branch_id uuid NOT NULL,
	to_branch_id uuid NOT NULL,
	status text DEFAULT 'pending'::text NOT NULL,
	notes text NULL,
	requested_by uuid NULL,
	requested_at timestamptz DEFAULT now() NOT NULL,
	resolved_by uuid NULL,
	resolved_at timestamptz NULL,
	resolution_type text NULL,
	resolution_reason text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT inventory_transfer_requests_branch_check CHECK ((from_branch_id <> to_branch_id)),
	CONSTRAINT inventory_transfer_requests_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_transfer_requests_resolution_type_check CHECK (((resolution_type IS NULL) OR (resolution_type = ANY (ARRAY['anulacion'::text, 'devolucion'::text, 'reposicion'::text])))),
	CONSTRAINT inventory_transfer_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'anulled'::text, 'returned'::text, 'replenished'::text])))
);
CREATE INDEX idx_inventory_transfer_requests_from_branch ON public.inventory_transfer_requests USING btree (from_branch_id);
CREATE INDEX idx_inventory_transfer_requests_requested_at ON public.inventory_transfer_requests USING btree (requested_at DESC);
CREATE INDEX idx_inventory_transfer_requests_status ON public.inventory_transfer_requests USING btree (status);
CREATE INDEX idx_inventory_transfer_requests_to_branch ON public.inventory_transfer_requests USING btree (to_branch_id);

-- Table Triggers

create trigger trg_audit_inventory_transfer_requests after
insert
    or
delete
    or
update
    on
    public.inventory_transfer_requests for each row execute function audit_trigger();
create trigger trg_inventory_transfer_requests_set_updated_at before
update
    on
    public.inventory_transfer_requests for each row execute function set_updated_at();


-- public.parts definition

-- Drop table

-- DROP TABLE public.parts;

CREATE TABLE public.parts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	code text NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	category text NULL,
	category_id uuid NULL,
	image_url text NULL,
	"cost" numeric(12, 2) DEFAULT 0 NOT NULL,
	price numeric(12, 2) DEFAULT 0 NOT NULL,
	kit_price numeric(12, 2) DEFAULT 0 NOT NULL,
	quotation_min_price numeric(12, 2) NULL,
	quotation_max_price numeric(12, 2) NULL,
	tracking_mode text DEFAULT 'none'::text NOT NULL,
	requires_serialization bool DEFAULT false NOT NULL,
	branch_id uuid NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_by uuid NULL,
	updated_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT parts_cost_check CHECK ((cost >= (0)::numeric)),
	CONSTRAINT parts_kit_price_check CHECK ((kit_price >= (0)::numeric)),
	CONSTRAINT parts_pkey PRIMARY KEY (id),
	CONSTRAINT parts_price_check CHECK ((price >= (0)::numeric)),
	CONSTRAINT parts_quote_range_check CHECK (((quotation_min_price IS NULL) OR (quotation_max_price IS NULL) OR (quotation_max_price >= quotation_min_price))),
	CONSTRAINT parts_tracking_mode_check CHECK ((tracking_mode = ANY (ARRAY['none'::text, 'serial'::text, 'lot'::text])))
);
CREATE UNIQUE INDEX idx_parts_branch_code_unique ON public.parts USING btree (branch_id, code);
CREATE INDEX idx_parts_branch_id ON public.parts USING btree (branch_id);
CREATE INDEX idx_parts_category ON public.parts USING btree (category);
CREATE INDEX idx_parts_requires_serialization ON public.parts USING btree (requires_serialization);
CREATE INDEX idx_parts_tracking_mode ON public.parts USING btree (tracking_mode);

-- Table Triggers

create trigger trg_audit_parts after
insert
    or
delete
    or
update
    on
    public.parts for each row execute function audit_trigger();
create trigger trg_parts_set_updated_at before
update
    on
    public.parts for each row execute function set_updated_at();


-- public.product_kit_items definition

-- Drop table

-- DROP TABLE public.product_kit_items;

CREATE TABLE public.product_kit_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	kit_id uuid NOT NULL,
	part_id uuid NOT NULL,
	quantity numeric(12, 3) NOT NULL,
	kit_price numeric(12, 2) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT product_kit_items_kit_id_part_id_key UNIQUE (kit_id, part_id),
	CONSTRAINT product_kit_items_kit_price_check CHECK ((kit_price >= (0)::numeric)),
	CONSTRAINT product_kit_items_pkey PRIMARY KEY (id),
	CONSTRAINT product_kit_items_quantity_check CHECK ((quantity > (0)::numeric))
);
CREATE INDEX idx_product_kit_items_kit_id ON public.product_kit_items USING btree (kit_id);
CREATE INDEX idx_product_kit_items_part_id ON public.product_kit_items USING btree (part_id);

-- Table Triggers

create trigger trg_audit_product_kit_items after
insert
    or
delete
    or
update
    on
    public.product_kit_items for each row execute function audit_trigger();
create trigger trg_product_kit_items_set_updated_at before
update
    on
    public.product_kit_items for each row execute function set_updated_at();


-- public.product_kits definition

-- Drop table

-- DROP TABLE public.product_kits;

CREATE TABLE public.product_kits (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	code text NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	category text NULL,
	category_id uuid NULL,
	branch_id uuid NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_by uuid NULL,
	updated_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT product_kits_branch_id_code_key UNIQUE (branch_id, code),
	CONSTRAINT product_kits_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_product_kits_branch_id ON public.product_kits USING btree (branch_id);
CREATE INDEX idx_product_kits_category ON public.product_kits USING btree (category);

-- Table Triggers

create trigger trg_audit_product_kits after
insert
    or
delete
    or
update
    on
    public.product_kits for each row execute function audit_trigger();
create trigger trg_product_kits_set_updated_at before
update
    on
    public.product_kits for each row execute function set_updated_at();


-- public.product_price_tiers definition

-- Drop table

-- DROP TABLE public.product_price_tiers;

CREATE TABLE public.product_price_tiers (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	part_id uuid NOT NULL,
	min_quantity int4 NOT NULL,
	price numeric(12, 2) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT product_price_tiers_min_quantity_check CHECK ((min_quantity >= 1)),
	CONSTRAINT product_price_tiers_part_id_min_quantity_key UNIQUE (part_id, min_quantity),
	CONSTRAINT product_price_tiers_pkey PRIMARY KEY (id),
	CONSTRAINT product_price_tiers_price_check CHECK ((price >= (0)::numeric))
);
CREATE INDEX idx_product_price_tiers_min_quantity ON public.product_price_tiers USING btree (min_quantity);
CREATE INDEX idx_product_price_tiers_part_id ON public.product_price_tiers USING btree (part_id);

-- Table Triggers

create trigger trg_audit_product_price_tiers after
insert
    or
delete
    or
update
    on
    public.product_price_tiers for each row execute function audit_trigger();
create trigger trg_product_price_tiers_set_updated_at before
update
    on
    public.product_price_tiers for each row execute function set_updated_at();


-- public.serialized_inventory_events definition

-- Drop table

-- DROP TABLE public.serialized_inventory_events;

CREATE TABLE public.serialized_inventory_events (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	serialized_sale_id uuid NOT NULL,
	part_id uuid NOT NULL,
	branch_id uuid NOT NULL,
	serial_number text NOT NULL,
	sale_id uuid NULL,
	sale_item_id uuid NULL,
	event_type text NOT NULL,
	event_date timestamptz DEFAULT now() NOT NULL,
	performed_by uuid NULL,
	notes text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT serialized_inventory_events_event_type_check CHECK ((event_type = ANY (ARRAY['sold'::text, 'returned'::text, 'restocked'::text, 'voided'::text, 'scrapped'::text]))),
	CONSTRAINT serialized_inventory_events_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_serialized_inventory_events_branch_id ON public.serialized_inventory_events USING btree (branch_id);
CREATE INDEX idx_serialized_inventory_events_event_date ON public.serialized_inventory_events USING btree (event_date DESC);
CREATE INDEX idx_serialized_inventory_events_event_type ON public.serialized_inventory_events USING btree (event_type);
CREATE INDEX idx_serialized_inventory_events_serialized_sale_id ON public.serialized_inventory_events USING btree (serialized_sale_id);

-- Table Triggers

create trigger trg_audit_serialized_inventory_events after
insert
    or
delete
    or
update
    on
    public.serialized_inventory_events for each row execute function audit_trigger();


-- public.serialized_inventory_sales definition

-- Drop table

-- DROP TABLE public.serialized_inventory_sales;

CREATE TABLE public.serialized_inventory_sales (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	part_id uuid NOT NULL,
	branch_id uuid NOT NULL,
	serial_number text NOT NULL,
	sold_sale_id uuid NULL,
	sold_sale_item_id uuid NULL,
	sold_at timestamptz DEFAULT now() NOT NULL,
	status text DEFAULT 'sold'::text NOT NULL,
	notes text NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	returned_at timestamptz NULL,
	returned_by uuid NULL,
	returned_reason text NULL,
	CONSTRAINT serialized_inventory_sales_part_id_branch_id_serial_number_key UNIQUE (part_id, branch_id, serial_number),
	CONSTRAINT serialized_inventory_sales_pkey PRIMARY KEY (id),
	CONSTRAINT serialized_inventory_sales_status_check CHECK ((status = ANY (ARRAY['sold'::text, 'returned'::text, 'voided'::text])))
);
CREATE INDEX idx_serialized_inventory_sales_branch ON public.serialized_inventory_sales USING btree (branch_id);
CREATE INDEX idx_serialized_inventory_sales_part ON public.serialized_inventory_sales USING btree (part_id);
CREATE INDEX idx_serialized_inventory_sales_sold_at ON public.serialized_inventory_sales USING btree (sold_at DESC);

-- Table Triggers

create trigger trg_audit_serialized_inventory_sales after
insert
    or
delete
    or
update
    on
    public.serialized_inventory_sales for each row execute function audit_trigger();


-- public.user_roles definition

-- Drop table

-- DROP TABLE public.user_roles;

CREATE TABLE public.user_roles (
	user_id uuid NOT NULL,
	role_id uuid NOT NULL,
	assigned_at timestamptz DEFAULT now() NOT NULL,
	assigned_by uuid NULL,
	CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id)
);
CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

-- Table Triggers

create trigger trg_audit_user_roles after
insert
    or
delete
    or
update
    on
    public.user_roles for each row execute function audit_trigger();


-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	id uuid NOT NULL,
	full_name text NOT NULL,
	phone text NULL,
	email text NOT NULL,
	branch_id uuid NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	role_id uuid NOT NULL,
	CONSTRAINT users_email_key UNIQUE (email),
	CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_users_branch_id ON public.users USING btree (branch_id);
CREATE INDEX idx_users_id_is_active ON public.users USING btree (id, is_active);
CREATE INDEX idx_users_role_id_is_active ON public.users USING btree (role_id, is_active);

-- Table Triggers

create trigger trg_audit_users after
insert
    or
delete
    or
update
    on
    public.users for each row execute function audit_trigger();
create trigger trg_users_set_updated_at before
update
    on
    public.users for each row execute function set_updated_at();


-- public.inventory foreign keys

ALTER TABLE public.inventory ADD CONSTRAINT inventory_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.inventory ADD CONSTRAINT inventory_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE CASCADE;


-- public.inventory_control_records foreign keys

ALTER TABLE public.inventory_control_records ADD CONSTRAINT inventory_control_records_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_control_records ADD CONSTRAINT inventory_control_records_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;
ALTER TABLE public.inventory_control_records ADD CONSTRAINT inventory_control_records_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.inventory_entries foreign keys

ALTER TABLE public.inventory_entries ADD CONSTRAINT inventory_entries_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_entries ADD CONSTRAINT inventory_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_entries ADD CONSTRAINT inventory_entries_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;


-- public.inventory_exits foreign keys

ALTER TABLE public.inventory_exits ADD CONSTRAINT inventory_exits_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_exits ADD CONSTRAINT inventory_exits_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_exits ADD CONSTRAINT inventory_exits_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;


-- public.inventory_movement_history foreign keys

ALTER TABLE public.inventory_movement_history ADD CONSTRAINT inventory_movement_history_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_movement_history ADD CONSTRAINT inventory_movement_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_movement_history ADD CONSTRAINT inventory_movement_history_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;


-- public.inventory_return_settings foreign keys

ALTER TABLE public.inventory_return_settings ADD CONSTRAINT inventory_return_settings_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_return_settings ADD CONSTRAINT inventory_return_settings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_return_settings ADD CONSTRAINT inventory_return_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.inventory_transfer_action_history foreign keys

ALTER TABLE public.inventory_transfer_action_history ADD CONSTRAINT inventory_transfer_action_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_transfer_action_history ADD CONSTRAINT inventory_transfer_action_history_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.inventory_transfer_requests(id) ON DELETE CASCADE;


-- public.inventory_transfer_request_items foreign keys

ALTER TABLE public.inventory_transfer_request_items ADD CONSTRAINT inventory_transfer_request_items_destination_part_id_fkey FOREIGN KEY (destination_part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;
ALTER TABLE public.inventory_transfer_request_items ADD CONSTRAINT inventory_transfer_request_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;
ALTER TABLE public.inventory_transfer_request_items ADD CONSTRAINT inventory_transfer_request_items_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.inventory_transfer_requests(id) ON DELETE CASCADE;


-- public.inventory_transfer_requests foreign keys

ALTER TABLE public.inventory_transfer_requests ADD CONSTRAINT inventory_transfer_requests_from_branch_id_fkey FOREIGN KEY (from_branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_transfer_requests ADD CONSTRAINT inventory_transfer_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_transfer_requests ADD CONSTRAINT inventory_transfer_requests_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_transfer_requests ADD CONSTRAINT inventory_transfer_requests_to_branch_id_fkey FOREIGN KEY (to_branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


-- public.parts foreign keys

ALTER TABLE public.parts ADD CONSTRAINT parts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.parts ADD CONSTRAINT parts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.inventory_categories(id) ON DELETE SET NULL;
ALTER TABLE public.parts ADD CONSTRAINT parts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.parts ADD CONSTRAINT parts_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.product_kit_items foreign keys

ALTER TABLE public.product_kit_items ADD CONSTRAINT product_kit_items_kit_id_fkey FOREIGN KEY (kit_id) REFERENCES public.product_kits(id) ON DELETE CASCADE;
ALTER TABLE public.product_kit_items ADD CONSTRAINT product_kit_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;


-- public.product_kits foreign keys

ALTER TABLE public.product_kits ADD CONSTRAINT product_kits_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.product_kits ADD CONSTRAINT product_kits_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.inventory_categories(id) ON DELETE SET NULL;
ALTER TABLE public.product_kits ADD CONSTRAINT product_kits_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.product_kits ADD CONSTRAINT product_kits_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.product_price_tiers foreign keys

ALTER TABLE public.product_price_tiers ADD CONSTRAINT product_price_tiers_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE CASCADE;


-- public.serialized_inventory_events foreign keys

ALTER TABLE public.serialized_inventory_events ADD CONSTRAINT serialized_inventory_events_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.serialized_inventory_events ADD CONSTRAINT serialized_inventory_events_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;
ALTER TABLE public.serialized_inventory_events ADD CONSTRAINT serialized_inventory_events_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.serialized_inventory_events ADD CONSTRAINT serialized_inventory_events_serialized_sale_id_fkey FOREIGN KEY (serialized_sale_id) REFERENCES public.serialized_inventory_sales(id) ON DELETE CASCADE;


-- public.serialized_inventory_sales foreign keys

ALTER TABLE public.serialized_inventory_sales ADD CONSTRAINT serialized_inventory_sales_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.serialized_inventory_sales ADD CONSTRAINT serialized_inventory_sales_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.serialized_inventory_sales ADD CONSTRAINT serialized_inventory_sales_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;
ALTER TABLE public.serialized_inventory_sales ADD CONSTRAINT serialized_inventory_sales_returned_by_fkey FOREIGN KEY (returned_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.user_roles foreign keys

ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- public.users foreign keys

ALTER TABLE public.users ADD CONSTRAINT users_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.users ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);