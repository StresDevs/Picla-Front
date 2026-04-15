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


-- public.inventory_product_code_prefixes definition

-- Drop table

-- DROP TABLE public.inventory_product_code_prefixes;

CREATE TABLE public.inventory_product_code_prefixes (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	branch_id uuid NOT NULL,
	category_key text NOT NULL,
	category_name text NOT NULL,
	prefix text NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT inventory_product_code_prefixes_branch_key_unique UNIQUE (branch_id, category_key),
	CONSTRAINT inventory_product_code_prefixes_branch_prefix_unique UNIQUE (branch_id, prefix),
	CONSTRAINT inventory_product_code_prefixes_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_product_code_prefixes_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE
);
CREATE INDEX idx_inventory_product_code_prefixes_branch ON public.inventory_product_code_prefixes USING btree (branch_id);

-- Table Triggers

create trigger trg_inventory_product_code_prefixes_set_updated_at before
update
    on
    public.inventory_product_code_prefixes for each row execute function set_updated_at();


-- public.inventory_product_code_counters definition

-- Drop table

-- DROP TABLE public.inventory_product_code_counters;

CREATE TABLE public.inventory_product_code_counters (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	branch_id uuid NOT NULL,
	prefix text NOT NULL,
	next_number int4 DEFAULT 1 NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT inventory_product_code_counters_branch_prefix_unique UNIQUE (branch_id, prefix),
	CONSTRAINT inventory_product_code_counters_next_number_check CHECK ((next_number >= 1)),
	CONSTRAINT inventory_product_code_counters_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_product_code_counters_prefix_fkey FOREIGN KEY (branch_id,prefix) REFERENCES public.inventory_product_code_prefixes(branch_id,prefix) ON DELETE CASCADE
);
CREATE INDEX idx_inventory_product_code_counters_branch ON public.inventory_product_code_counters USING btree (branch_id);

-- Table Triggers

create trigger trg_inventory_product_code_counters_set_updated_at before
update
    on
    public.inventory_product_code_counters for each row execute function set_updated_at();


-- public.billing_invoice_artifacts definition

-- Drop table

-- DROP TABLE public.billing_invoice_artifacts;

CREATE TABLE public.billing_invoice_artifacts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	sale_id uuid NOT NULL,
	artifact_type text NOT NULL,
	storage_path text NULL,
	content_text text NULL,
	content_hash text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT billing_invoice_artifacts_artifact_type_check CHECK ((artifact_type = ANY (ARRAY['xml_sent'::text, 'xml_authorized'::text, 'hash'::text, 'siat_response'::text, 'pdf'::text]))),
	CONSTRAINT billing_invoice_artifacts_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_billing_invoice_artifacts_sale ON public.billing_invoice_artifacts USING btree (sale_id, created_at DESC);

-- Table Triggers

create trigger trg_audit_billing_invoice_artifacts after
insert
    or
delete
    or
update
    on
    public.billing_invoice_artifacts for each row execute function audit_trigger();


-- public.billing_invoice_attempts definition

-- Drop table

-- DROP TABLE public.billing_invoice_attempts;

CREATE TABLE public.billing_invoice_attempts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	job_id uuid NOT NULL,
	sale_id uuid NOT NULL,
	attempt_number int4 NOT NULL,
	request_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
	response_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
	response_http_status int4 NULL,
	response_code text NULL,
	error_message text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT billing_invoice_attempts_attempt_number_check CHECK ((attempt_number > 0)),
	CONSTRAINT billing_invoice_attempts_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_billing_invoice_attempts_job ON public.billing_invoice_attempts USING btree (job_id, created_at DESC);

-- Table Triggers

create trigger trg_audit_billing_invoice_attempts after
insert
    or
delete
    or
update
    on
    public.billing_invoice_attempts for each row execute function audit_trigger();


-- public.billing_invoice_jobs definition

-- Drop table

-- DROP TABLE public.billing_invoice_jobs;

CREATE TABLE public.billing_invoice_jobs (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	sale_id uuid NOT NULL,
	job_type text DEFAULT 'siat_invoice'::text NOT NULL,
	status text DEFAULT 'queued'::text NOT NULL,
	attempt_count int4 DEFAULT 0 NOT NULL,
	max_attempts int4 DEFAULT 10 NOT NULL,
	next_run_at timestamptz DEFAULT now() NOT NULL,
	last_error text NULL,
	payload jsonb DEFAULT '{}'::jsonb NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	processed_at timestamptz NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT billing_invoice_jobs_attempt_count_check CHECK ((attempt_count >= 0)),
	CONSTRAINT billing_invoice_jobs_job_type_check CHECK ((job_type = 'siat_invoice'::text)),
	CONSTRAINT billing_invoice_jobs_max_attempts_check CHECK ((max_attempts > 0)),
	CONSTRAINT billing_invoice_jobs_pkey PRIMARY KEY (id),
	CONSTRAINT billing_invoice_jobs_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'processing'::text, 'retry'::text, 'failed'::text, 'completed'::text, 'cancelled'::text, 'contingency'::text])))
);
CREATE INDEX idx_billing_invoice_jobs_sale ON public.billing_invoice_jobs USING btree (sale_id);
CREATE INDEX idx_billing_invoice_jobs_status_next_run ON public.billing_invoice_jobs USING btree (status, next_run_at);

-- Table Triggers

create trigger trg_audit_billing_invoice_jobs after
insert
    or
delete
    or
update
    on
    public.billing_invoice_jobs for each row execute function audit_trigger();
create trigger trg_billing_invoice_jobs_set_updated_at before
update
    on
    public.billing_invoice_jobs for each row execute function set_updated_at();


-- public.cash_inventory_snapshot_items definition

-- Drop table

-- DROP TABLE public.cash_inventory_snapshot_items;

CREATE TABLE public.cash_inventory_snapshot_items (
	snapshot_id uuid NOT NULL,
	part_id uuid NOT NULL,
	part_code text NULL,
	part_name text NULL,
	quantity numeric(12, 3) NOT NULL,
	CONSTRAINT cash_inventory_snapshot_items_pkey PRIMARY KEY (snapshot_id, part_id),
	CONSTRAINT cash_inventory_snapshot_items_quantity_check CHECK ((quantity >= (0)::numeric))
);
CREATE INDEX idx_cash_inventory_snapshot_items_part ON public.cash_inventory_snapshot_items USING btree (part_id);

-- Table Triggers

create trigger trg_audit_cash_inventory_snapshot_items after
insert
    or
delete
    or
update
    on
    public.cash_inventory_snapshot_items for each row execute function audit_trigger();


-- public.cash_inventory_snapshots definition

-- Drop table

-- DROP TABLE public.cash_inventory_snapshots;

CREATE TABLE public.cash_inventory_snapshots (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	cash_session_id uuid NOT NULL,
	branch_id uuid NOT NULL,
	snapshot_type text NOT NULL,
	item_count int4 DEFAULT 0 NOT NULL,
	total_units numeric(12, 3) DEFAULT 0 NOT NULL,
	taken_by uuid NULL,
	taken_at timestamptz DEFAULT now() NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT cash_inventory_snapshots_item_count_check CHECK ((item_count >= 0)),
	CONSTRAINT cash_inventory_snapshots_pkey PRIMARY KEY (id),
	CONSTRAINT cash_inventory_snapshots_session_type_key UNIQUE (cash_session_id, snapshot_type),
	CONSTRAINT cash_inventory_snapshots_total_units_check CHECK ((total_units >= (0)::numeric)),
	CONSTRAINT cash_inventory_snapshots_type_check CHECK ((snapshot_type = ANY (ARRAY['open'::text, 'close'::text])))
);
CREATE INDEX idx_cash_inventory_snapshots_branch_taken_at ON public.cash_inventory_snapshots USING btree (branch_id, taken_at DESC);
CREATE INDEX idx_cash_inventory_snapshots_session ON public.cash_inventory_snapshots USING btree (cash_session_id);

-- Table Triggers

create trigger trg_audit_cash_inventory_snapshots after
insert
    or
delete
    or
update
    on
    public.cash_inventory_snapshots for each row execute function audit_trigger();


-- public.cash_movement_edit_logs definition

-- Drop table

-- DROP TABLE public.cash_movement_edit_logs;

CREATE TABLE public.cash_movement_edit_logs (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	movement_id uuid NOT NULL,
	request_id uuid NULL,
	branch_id uuid NOT NULL,
	changed_by uuid NULL,
	change_type text NOT NULL,
	change_reason text NOT NULL,
	old_amount numeric(12, 2) NOT NULL,
	new_amount numeric(12, 2) NOT NULL,
	old_description text NOT NULL,
	new_description text NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT cash_movement_edit_logs_pkey PRIMARY KEY (id),
	CONSTRAINT cash_movement_edit_logs_type_check CHECK ((change_type = ANY (ARRAY['admin_direct'::text, 'request_approved'::text])))
);
CREATE INDEX idx_cash_movement_edit_logs_branch_date ON public.cash_movement_edit_logs USING btree (branch_id, created_at DESC);
CREATE INDEX idx_cash_movement_edit_logs_movement ON public.cash_movement_edit_logs USING btree (movement_id);
CREATE INDEX idx_cash_movement_edit_logs_request ON public.cash_movement_edit_logs USING btree (request_id);

-- Table Triggers

create trigger trg_audit_cash_movement_edit_logs after
insert
    or
delete
    or
update
    on
    public.cash_movement_edit_logs for each row execute function audit_trigger();


-- public.cash_movement_edit_requests definition

-- Drop table

-- DROP TABLE public.cash_movement_edit_requests;

CREATE TABLE public.cash_movement_edit_requests (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	movement_id uuid NOT NULL,
	cash_session_id uuid NOT NULL,
	branch_id uuid NOT NULL,
	requested_by uuid NULL,
	requested_role text NOT NULL,
	request_reason text NOT NULL,
	proposed_amount numeric(12, 2) NULL,
	proposed_description text NULL,
	status text DEFAULT 'pending'::text NOT NULL,
	review_notes text NULL,
	reviewed_by uuid NULL,
	reviewed_at timestamptz NULL,
	applied bool DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT cash_movement_edit_requests_amount_check CHECK (((proposed_amount IS NULL) OR (proposed_amount > (0)::numeric))),
	CONSTRAINT cash_movement_edit_requests_pkey PRIMARY KEY (id),
	CONSTRAINT cash_movement_edit_requests_role_check CHECK ((requested_role = ANY (ARRAY['admin'::text, 'manager'::text]))),
	CONSTRAINT cash_movement_edit_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text])))
);
CREATE INDEX idx_cash_movement_edit_requests_branch_status ON public.cash_movement_edit_requests USING btree (branch_id, status, created_at DESC);
CREATE INDEX idx_cash_movement_edit_requests_movement ON public.cash_movement_edit_requests USING btree (movement_id);
CREATE INDEX idx_cash_movement_edit_requests_session ON public.cash_movement_edit_requests USING btree (cash_session_id);

-- Table Triggers

create trigger trg_audit_cash_movement_edit_requests after
insert
    or
delete
    or
update
    on
    public.cash_movement_edit_requests for each row execute function audit_trigger();
create trigger trg_cash_movement_edit_requests_set_updated_at before
update
    on
    public.cash_movement_edit_requests for each row execute function set_updated_at();


-- public.cash_movements definition

-- Drop table

-- DROP TABLE public.cash_movements;

CREATE TABLE public.cash_movements (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	cash_session_id uuid NOT NULL,
	branch_id uuid NOT NULL,
	movement_type text NOT NULL,
	amount numeric(12, 2) NOT NULL,
	description text NOT NULL,
	payment_method text NULL,
	reference_table text NULL,
	reference_id uuid NULL,
	created_by uuid NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_by uuid NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT cash_movements_amount_check CHECK ((amount > (0)::numeric)),
	CONSTRAINT cash_movements_pkey PRIMARY KEY (id),
	CONSTRAINT cash_movements_type_check CHECK ((movement_type = ANY (ARRAY['manual_income'::text, 'manual_expense'::text, 'sale_cash'::text, 'sale_return_cash'::text, 'sale_card'::text, 'sale_qr'::text, 'sale_return_card'::text, 'sale_return_qr'::text])))
);
CREATE INDEX idx_cash_movements_branch_created_at ON public.cash_movements USING btree (branch_id, created_at DESC);
CREATE INDEX idx_cash_movements_reference ON public.cash_movements USING btree (reference_table, reference_id);
CREATE INDEX idx_cash_movements_session ON public.cash_movements USING btree (cash_session_id);

-- Table Triggers

create trigger trg_audit_cash_movements after
insert
    or
delete
    or
update
    on
    public.cash_movements for each row execute function audit_trigger();
create trigger trg_cash_movements_set_updated_at before
update
    on
    public.cash_movements for each row execute function set_updated_at();


-- public.cash_sessions definition

-- Drop table

-- DROP TABLE public.cash_sessions;

CREATE TABLE public.cash_sessions (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	branch_id uuid NOT NULL,
	opened_by uuid NULL,
	opening_amount numeric(12, 2) NOT NULL,
	opening_notes text NULL,
	status text DEFAULT 'open'::text NOT NULL,
	expected_closing_amount numeric(12, 2) NULL,
	closing_amount_counted numeric(12, 2) NULL,
	variance_amount numeric(12, 2) NULL,
	closed_by uuid NULL,
	closing_notes text NULL,
	opened_at timestamptz DEFAULT now() NOT NULL,
	closed_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	opening_role text DEFAULT 'employee'::text NOT NULL,
	CONSTRAINT cash_sessions_amounts_check CHECK (((opening_amount >= (0)::numeric) AND ((closing_amount_counted IS NULL) OR (closing_amount_counted >= (0)::numeric)))),
	CONSTRAINT cash_sessions_opening_role_check CHECK ((opening_role = ANY (ARRAY['admin'::text, 'manager'::text, 'employee'::text]))),
	CONSTRAINT cash_sessions_pkey PRIMARY KEY (id),
	CONSTRAINT cash_sessions_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);
CREATE INDEX idx_cash_sessions_branch_status ON public.cash_sessions USING btree (branch_id, status);
CREATE INDEX idx_cash_sessions_closed_at_desc ON public.cash_sessions USING btree (closed_at DESC);
CREATE UNIQUE INDEX idx_cash_sessions_one_open_per_branch ON public.cash_sessions USING btree (branch_id) WHERE (status = 'open'::text);
CREATE INDEX idx_cash_sessions_opened_at_desc ON public.cash_sessions USING btree (opened_at DESC);

-- Table Triggers

create trigger trg_audit_cash_sessions after
insert
    or
delete
    or
update
    on
    public.cash_sessions for each row execute function audit_trigger();
create trigger trg_cash_sessions_set_updated_at before
update
    on
    public.cash_sessions for each row execute function set_updated_at();


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
	CONSTRAINT inventory_movement_history_type_check CHECK ((movement_type = ANY (ARRAY['salida_ajuste'::text, 'traspaso_salida'::text, 'traspaso_ingreso'::text, 'anulacion'::text, 'devolucion'::text, 'reposicion'::text, 'ajuste_manual'::text, 'ingreso_restock'::text, 'venta'::text, 'devolucion_venta'::text])))
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
	reserved_quantity numeric(12, 3) DEFAULT 0 NOT NULL,
	CONSTRAINT inventory_transfer_request_items_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_transfer_request_items_quantity_check CHECK ((quantity > (0)::numeric)),
	CONSTRAINT inventory_transfer_request_items_reserved_quantity_check CHECK (((reserved_quantity >= (0)::numeric) AND (reserved_quantity <= quantity))),
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


-- public.pos_sale_delivery_event_items definition

-- Drop table

-- DROP TABLE public.pos_sale_delivery_event_items;

CREATE TABLE public.pos_sale_delivery_event_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	event_id uuid NOT NULL,
	sale_item_id uuid NOT NULL,
	part_id uuid NOT NULL,
	quantity_delivered numeric(12, 3) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT pos_sale_delivery_event_items_pkey PRIMARY KEY (id),
	CONSTRAINT pos_sale_delivery_event_items_quantity_check CHECK ((quantity_delivered > (0)::numeric))
);
CREATE INDEX idx_pos_sale_delivery_event_items_event ON public.pos_sale_delivery_event_items USING btree (event_id);

-- Table Triggers

create trigger trg_audit_pos_sale_delivery_event_items after
insert
    or
delete
    or
update
    on
    public.pos_sale_delivery_event_items for each row execute function audit_trigger();


-- public.pos_sale_delivery_events definition

-- Drop table

-- DROP TABLE public.pos_sale_delivery_events;

CREATE TABLE public.pos_sale_delivery_events (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	sale_id uuid NOT NULL,
	branch_id uuid NOT NULL,
	delivered_by uuid NULL,
	notes text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT pos_sale_delivery_events_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_pos_sale_delivery_events_sale ON public.pos_sale_delivery_events USING btree (sale_id, created_at DESC);

-- Table Triggers

create trigger trg_audit_pos_sale_delivery_events after
insert
    or
delete
    or
update
    on
    public.pos_sale_delivery_events for each row execute function audit_trigger();


-- public.pos_sale_items definition

-- Drop table

-- DROP TABLE public.pos_sale_items;

CREATE TABLE public.pos_sale_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	sale_id uuid NOT NULL,
	branch_id uuid NOT NULL,
	part_id uuid NOT NULL,
	source_type text DEFAULT 'product'::text NOT NULL,
	source_kit_id text NULL,
	part_code text NOT NULL,
	part_name text NOT NULL,
	quantity numeric(12, 3) NOT NULL,
	unit_price numeric(12, 2) NOT NULL,
	line_discount numeric(12, 2) DEFAULT 0 NOT NULL,
	line_total numeric(12, 2) NOT NULL,
	delivered_quantity numeric(12, 3) DEFAULT 0 NOT NULL,
	delivery_status text DEFAULT 'delivered'::text NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT pos_sale_items_delivered_quantity_check CHECK (((delivered_quantity >= (0)::numeric) AND (delivered_quantity <= quantity))),
	CONSTRAINT pos_sale_items_delivery_status_check CHECK ((delivery_status = ANY (ARRAY['pending'::text, 'partial'::text, 'delivered'::text]))),
	CONSTRAINT pos_sale_items_line_discount_check CHECK ((line_discount >= (0)::numeric)),
	CONSTRAINT pos_sale_items_line_total_check CHECK ((line_total >= (0)::numeric)),
	CONSTRAINT pos_sale_items_pkey PRIMARY KEY (id),
	CONSTRAINT pos_sale_items_quantity_check CHECK ((quantity > (0)::numeric)),
	CONSTRAINT pos_sale_items_source_type_check CHECK ((source_type = ANY (ARRAY['product'::text, 'kit_component'::text]))),
	CONSTRAINT pos_sale_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);
CREATE INDEX idx_pos_sale_items_branch_id ON public.pos_sale_items USING btree (branch_id);
CREATE INDEX idx_pos_sale_items_part_id ON public.pos_sale_items USING btree (part_id);
CREATE INDEX idx_pos_sale_items_sale_id ON public.pos_sale_items USING btree (sale_id);

-- Table Triggers

create trigger trg_audit_pos_sale_items after
insert
    or
delete
    or
update
    on
    public.pos_sale_items for each row execute function audit_trigger();
create trigger trg_pos_sale_items_set_updated_at before
update
    on
    public.pos_sale_items for each row execute function set_updated_at();


-- public.pos_sale_queue definition

-- Drop table

-- DROP TABLE public.pos_sale_queue;

CREATE TABLE public.pos_sale_queue (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	branch_id uuid NOT NULL,
	created_by uuid NULL,
	created_by_role text NOT NULL,
	customer_name text NULL,
	payment_method text NOT NULL,
	payment_currency text DEFAULT 'BOB'::text NOT NULL,
	exchange_rate numeric(12, 6) DEFAULT 1 NOT NULL,
	total_amount_bob numeric(12, 2) DEFAULT 0 NOT NULL,
	total_amount_usd numeric(12, 2) DEFAULT 0 NOT NULL,
	sale_mode text DEFAULT 'immediate'::text NOT NULL,
	advance_amount numeric(12, 2) DEFAULT 0 NOT NULL,
	requested_delivery_status text DEFAULT 'delivered'::text NOT NULL,
	status text DEFAULT 'queued'::text NOT NULL,
	approved_by uuid NULL,
	approved_by_role text NULL,
	approved_sale_id uuid NULL,
	approval_notes text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	approved_at timestamptz NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT pos_sale_queue_advance_amount_check CHECK ((advance_amount >= (0)::numeric)),
	CONSTRAINT pos_sale_queue_approved_by_role_check CHECK (((approved_by_role IS NULL) OR (approved_by_role = ANY (ARRAY['admin'::text, 'manager'::text, 'employee'::text])))),
	CONSTRAINT pos_sale_queue_created_by_role_check CHECK ((created_by_role = ANY (ARRAY['admin'::text, 'manager'::text, 'employee'::text, 'read_only'::text]))),
	CONSTRAINT pos_sale_queue_exchange_rate_check CHECK ((exchange_rate > (0)::numeric)),
	CONSTRAINT pos_sale_queue_payment_currency_check CHECK ((payment_currency = ANY (ARRAY['BOB'::text, 'USD'::text]))),
	CONSTRAINT pos_sale_queue_payment_method_check CHECK ((payment_method = ANY (ARRAY['cash'::text, 'card'::text, 'qr'::text]))),
	CONSTRAINT pos_sale_queue_pkey PRIMARY KEY (id),
	CONSTRAINT pos_sale_queue_requested_delivery_status_check CHECK ((requested_delivery_status = ANY (ARRAY['pending'::text, 'partial'::text, 'delivered'::text]))),
	CONSTRAINT pos_sale_queue_sale_mode_check CHECK ((sale_mode = ANY (ARRAY['immediate'::text, 'advance'::text]))),
	CONSTRAINT pos_sale_queue_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text]))),
	CONSTRAINT pos_sale_queue_total_bob_check CHECK ((total_amount_bob >= (0)::numeric)),
	CONSTRAINT pos_sale_queue_total_usd_check CHECK ((total_amount_usd >= (0)::numeric))
);
CREATE INDEX idx_pos_sale_queue_approved_sale ON public.pos_sale_queue USING btree (approved_sale_id);
CREATE INDEX idx_pos_sale_queue_branch_status ON public.pos_sale_queue USING btree (branch_id, status, created_at DESC);
CREATE INDEX idx_pos_sale_queue_created_by ON public.pos_sale_queue USING btree (created_by);

-- Table Triggers

create trigger trg_audit_pos_sale_queue after
insert
    or
delete
    or
update
    on
    public.pos_sale_queue for each row execute function audit_trigger();
create trigger trg_pos_sale_queue_set_updated_at before
update
    on
    public.pos_sale_queue for each row execute function set_updated_at();


-- public.pos_sale_queue_items definition

-- Drop table

-- DROP TABLE public.pos_sale_queue_items;

CREATE TABLE public.pos_sale_queue_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	queue_id uuid NOT NULL,
	part_id uuid NOT NULL,
	source_type text DEFAULT 'product'::text NOT NULL,
	source_kit_id text NULL,
	part_name text NOT NULL,
	quantity numeric(12, 3) NOT NULL,
	unit_price numeric(12, 2) NOT NULL,
	line_total numeric(12, 2) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT pos_sale_queue_items_line_total_check CHECK ((line_total >= (0)::numeric)),
	CONSTRAINT pos_sale_queue_items_pkey PRIMARY KEY (id),
	CONSTRAINT pos_sale_queue_items_quantity_check CHECK ((quantity > (0)::numeric)),
	CONSTRAINT pos_sale_queue_items_source_type_check CHECK ((source_type = ANY (ARRAY['product'::text, 'kit_component'::text]))),
	CONSTRAINT pos_sale_queue_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);
CREATE INDEX idx_pos_sale_queue_items_part ON public.pos_sale_queue_items USING btree (part_id);
CREATE INDEX idx_pos_sale_queue_items_queue ON public.pos_sale_queue_items USING btree (queue_id);

-- Table Triggers

create trigger trg_audit_pos_sale_queue_items after
insert
    or
delete
    or
update
    on
    public.pos_sale_queue_items for each row execute function audit_trigger();


-- public.pos_sale_return_items definition

-- Drop table

-- DROP TABLE public.pos_sale_return_items;

CREATE TABLE public.pos_sale_return_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	return_id uuid NOT NULL,
	sale_item_id uuid NOT NULL,
	part_id uuid NOT NULL,
	quantity numeric(12, 3) NOT NULL,
	unit_price numeric(12, 2) NOT NULL,
	line_total numeric(12, 2) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT pos_sale_return_items_line_total_check CHECK ((line_total >= (0)::numeric)),
	CONSTRAINT pos_sale_return_items_pkey PRIMARY KEY (id),
	CONSTRAINT pos_sale_return_items_quantity_check CHECK ((quantity > (0)::numeric)),
	CONSTRAINT pos_sale_return_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);
CREATE INDEX idx_pos_sale_return_items_return ON public.pos_sale_return_items USING btree (return_id);
CREATE INDEX idx_pos_sale_return_items_sale_item ON public.pos_sale_return_items USING btree (sale_item_id);

-- Table Triggers

create trigger trg_audit_pos_sale_return_items after
insert
    or
delete
    or
update
    on
    public.pos_sale_return_items for each row execute function audit_trigger();


-- public.pos_sale_returns definition

-- Drop table

-- DROP TABLE public.pos_sale_returns;

CREATE TABLE public.pos_sale_returns (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	sale_id uuid NOT NULL,
	branch_id uuid NOT NULL,
	cash_session_id uuid NOT NULL,
	returned_by uuid NULL,
	reason text NOT NULL,
	notes text NULL,
	status text DEFAULT 'completed'::text NOT NULL,
	total_return_amount numeric(12, 2) DEFAULT 0 NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT pos_sale_returns_pkey PRIMARY KEY (id),
	CONSTRAINT pos_sale_returns_status_check CHECK ((status = ANY (ARRAY['completed'::text, 'cancelled'::text]))),
	CONSTRAINT pos_sale_returns_total_return_amount_check CHECK ((total_return_amount >= (0)::numeric))
);
CREATE INDEX idx_pos_sale_returns_branch_created ON public.pos_sale_returns USING btree (branch_id, created_at DESC);
CREATE INDEX idx_pos_sale_returns_sale ON public.pos_sale_returns USING btree (sale_id);

-- Table Triggers

create trigger trg_audit_pos_sale_returns after
insert
    or
delete
    or
update
    on
    public.pos_sale_returns for each row execute function audit_trigger();
create trigger trg_pos_sale_returns_set_updated_at before
update
    on
    public.pos_sale_returns for each row execute function set_updated_at();


-- public.pos_sales definition

-- Drop table

-- DROP TABLE public.pos_sales;

CREATE TABLE public.pos_sales (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	branch_id uuid NOT NULL,
	cash_session_id uuid NOT NULL,
	sold_by uuid NULL,
	customer_name text NULL,
	customer_document text NULL,
	payment_method text NOT NULL,
	payment_currency text DEFAULT 'BOB'::text NOT NULL,
	exchange_rate numeric(12, 6) DEFAULT 1 NOT NULL,
	subtotal_amount numeric(12, 2) DEFAULT 0 NOT NULL,
	discount_amount numeric(12, 2) DEFAULT 0 NOT NULL,
	total_amount numeric(12, 2) DEFAULT 0 NOT NULL,
	sale_mode text DEFAULT 'immediate'::text NOT NULL,
	advance_amount numeric(12, 2) DEFAULT 0 NOT NULL,
	pending_amount numeric(12, 2) DEFAULT 0 NOT NULL,
	delivery_status text DEFAULT 'delivered'::text NOT NULL,
	status text DEFAULT 'completed'::text NOT NULL,
	void_reason text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	siat_status text DEFAULT 'not_required'::text NOT NULL,
	siat_cuf text NULL,
	siat_invoice_number text NULL,
	siat_authorized_at timestamptz NULL,
	siat_response jsonb DEFAULT '{}'::jsonb NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT pos_sales_advance_amount_check CHECK ((advance_amount >= (0)::numeric)),
	CONSTRAINT pos_sales_delivery_status_check CHECK ((delivery_status = ANY (ARRAY['pending'::text, 'partial'::text, 'delivered'::text]))),
	CONSTRAINT pos_sales_discount_amount_check CHECK ((discount_amount >= (0)::numeric)),
	CONSTRAINT pos_sales_exchange_rate_check CHECK ((exchange_rate > (0)::numeric)),
	CONSTRAINT pos_sales_payment_currency_check CHECK ((payment_currency = ANY (ARRAY['BOB'::text, 'USD'::text]))),
	CONSTRAINT pos_sales_payment_method_check CHECK ((payment_method = ANY (ARRAY['cash'::text, 'card'::text, 'qr'::text]))),
	CONSTRAINT pos_sales_pending_amount_check CHECK ((pending_amount >= (0)::numeric)),
	CONSTRAINT pos_sales_pkey PRIMARY KEY (id),
	CONSTRAINT pos_sales_sale_mode_check CHECK ((sale_mode = ANY (ARRAY['immediate'::text, 'advance'::text]))),
	CONSTRAINT pos_sales_siat_status_check CHECK ((siat_status = ANY (ARRAY['not_required'::text, 'queued'::text, 'processing'::text, 'authorized'::text, 'rejected'::text, 'contingency_pending'::text]))),
	CONSTRAINT pos_sales_status_check CHECK ((status = ANY (ARRAY['completed'::text, 'voided'::text, 'cancelled'::text]))),
	CONSTRAINT pos_sales_subtotal_amount_check CHECK ((subtotal_amount >= (0)::numeric)),
	CONSTRAINT pos_sales_total_amount_check CHECK ((total_amount >= (0)::numeric))
);
CREATE INDEX idx_pos_sales_branch_created_at ON public.pos_sales USING btree (branch_id, created_at DESC);
CREATE INDEX idx_pos_sales_cash_session ON public.pos_sales USING btree (cash_session_id);
CREATE INDEX idx_pos_sales_delivery_status ON public.pos_sales USING btree (delivery_status);
CREATE INDEX idx_pos_sales_siat_status ON public.pos_sales USING btree (siat_status);
CREATE INDEX idx_pos_sales_status ON public.pos_sales USING btree (status);

-- Table Triggers

create trigger trg_audit_pos_sales after
insert
    or
delete
    or
update
    on
    public.pos_sales for each row execute function audit_trigger();
create trigger trg_pos_sales_set_updated_at before
update
    on
    public.pos_sales for each row execute function set_updated_at();


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


-- public.billing_invoice_artifacts foreign keys

ALTER TABLE public.billing_invoice_artifacts ADD CONSTRAINT billing_invoice_artifacts_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.pos_sales(id) ON DELETE CASCADE;


-- public.billing_invoice_attempts foreign keys

ALTER TABLE public.billing_invoice_attempts ADD CONSTRAINT billing_invoice_attempts_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.billing_invoice_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.billing_invoice_attempts ADD CONSTRAINT billing_invoice_attempts_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.pos_sales(id) ON DELETE CASCADE;


-- public.billing_invoice_jobs foreign keys

ALTER TABLE public.billing_invoice_jobs ADD CONSTRAINT billing_invoice_jobs_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.pos_sales(id) ON DELETE CASCADE;


-- public.cash_inventory_snapshot_items foreign keys

ALTER TABLE public.cash_inventory_snapshot_items ADD CONSTRAINT cash_inventory_snapshot_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;
ALTER TABLE public.cash_inventory_snapshot_items ADD CONSTRAINT cash_inventory_snapshot_items_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES public.cash_inventory_snapshots(id) ON DELETE CASCADE;


-- public.cash_inventory_snapshots foreign keys

ALTER TABLE public.cash_inventory_snapshots ADD CONSTRAINT cash_inventory_snapshots_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.cash_inventory_snapshots ADD CONSTRAINT cash_inventory_snapshots_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id) ON DELETE CASCADE;
ALTER TABLE public.cash_inventory_snapshots ADD CONSTRAINT cash_inventory_snapshots_taken_by_fkey FOREIGN KEY (taken_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.cash_movement_edit_logs foreign keys

ALTER TABLE public.cash_movement_edit_logs ADD CONSTRAINT cash_movement_edit_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.cash_movement_edit_logs ADD CONSTRAINT cash_movement_edit_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.cash_movement_edit_logs ADD CONSTRAINT cash_movement_edit_logs_movement_id_fkey FOREIGN KEY (movement_id) REFERENCES public.cash_movements(id) ON DELETE CASCADE;
ALTER TABLE public.cash_movement_edit_logs ADD CONSTRAINT cash_movement_edit_logs_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.cash_movement_edit_requests(id) ON DELETE SET NULL;


-- public.cash_movement_edit_requests foreign keys

ALTER TABLE public.cash_movement_edit_requests ADD CONSTRAINT cash_movement_edit_requests_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.cash_movement_edit_requests ADD CONSTRAINT cash_movement_edit_requests_movement_id_fkey FOREIGN KEY (movement_id) REFERENCES public.cash_movements(id) ON DELETE CASCADE;
ALTER TABLE public.cash_movement_edit_requests ADD CONSTRAINT cash_movement_edit_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.cash_movement_edit_requests ADD CONSTRAINT cash_movement_edit_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.cash_movement_edit_requests ADD CONSTRAINT cash_movement_edit_requests_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id) ON DELETE CASCADE;


-- public.cash_movements foreign keys

ALTER TABLE public.cash_movements ADD CONSTRAINT cash_movements_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.cash_movements ADD CONSTRAINT cash_movements_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id) ON DELETE CASCADE;
ALTER TABLE public.cash_movements ADD CONSTRAINT cash_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.cash_movements ADD CONSTRAINT cash_movements_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.cash_sessions foreign keys

ALTER TABLE public.cash_sessions ADD CONSTRAINT cash_sessions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.cash_sessions ADD CONSTRAINT cash_sessions_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.cash_sessions ADD CONSTRAINT cash_sessions_opened_by_fkey FOREIGN KEY (opened_by) REFERENCES public.users(id) ON DELETE SET NULL;


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


-- public.pos_sale_delivery_event_items foreign keys

ALTER TABLE public.pos_sale_delivery_event_items ADD CONSTRAINT pos_sale_delivery_event_items_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.pos_sale_delivery_events(id) ON DELETE CASCADE;
ALTER TABLE public.pos_sale_delivery_event_items ADD CONSTRAINT pos_sale_delivery_event_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_delivery_event_items ADD CONSTRAINT pos_sale_delivery_event_items_sale_item_id_fkey FOREIGN KEY (sale_item_id) REFERENCES public.pos_sale_items(id) ON DELETE RESTRICT;


-- public.pos_sale_delivery_events foreign keys

ALTER TABLE public.pos_sale_delivery_events ADD CONSTRAINT pos_sale_delivery_events_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_delivery_events ADD CONSTRAINT pos_sale_delivery_events_delivered_by_fkey FOREIGN KEY (delivered_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.pos_sale_delivery_events ADD CONSTRAINT pos_sale_delivery_events_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.pos_sales(id) ON DELETE CASCADE;


-- public.pos_sale_items foreign keys

ALTER TABLE public.pos_sale_items ADD CONSTRAINT pos_sale_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_items ADD CONSTRAINT pos_sale_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_items ADD CONSTRAINT pos_sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.pos_sales(id) ON DELETE CASCADE;


-- public.pos_sale_queue foreign keys

ALTER TABLE public.pos_sale_queue ADD CONSTRAINT pos_sale_queue_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.pos_sale_queue ADD CONSTRAINT pos_sale_queue_approved_sale_id_fkey FOREIGN KEY (approved_sale_id) REFERENCES public.pos_sales(id) ON DELETE SET NULL;
ALTER TABLE public.pos_sale_queue ADD CONSTRAINT pos_sale_queue_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_queue ADD CONSTRAINT pos_sale_queue_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.pos_sale_queue_items foreign keys

ALTER TABLE public.pos_sale_queue_items ADD CONSTRAINT pos_sale_queue_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_queue_items ADD CONSTRAINT pos_sale_queue_items_queue_id_fkey FOREIGN KEY (queue_id) REFERENCES public.pos_sale_queue(id) ON DELETE CASCADE;


-- public.pos_sale_return_items foreign keys

ALTER TABLE public.pos_sale_return_items ADD CONSTRAINT pos_sale_return_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_return_items ADD CONSTRAINT pos_sale_return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.pos_sale_returns(id) ON DELETE CASCADE;
ALTER TABLE public.pos_sale_return_items ADD CONSTRAINT pos_sale_return_items_sale_item_id_fkey FOREIGN KEY (sale_item_id) REFERENCES public.pos_sale_items(id) ON DELETE RESTRICT;


-- public.pos_sale_returns foreign keys

ALTER TABLE public.pos_sale_returns ADD CONSTRAINT pos_sale_returns_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_returns ADD CONSTRAINT pos_sale_returns_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id) ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_returns ADD CONSTRAINT pos_sale_returns_returned_by_fkey FOREIGN KEY (returned_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.pos_sale_returns ADD CONSTRAINT pos_sale_returns_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.pos_sales(id) ON DELETE RESTRICT;


-- public.pos_sales foreign keys

ALTER TABLE public.pos_sales ADD CONSTRAINT pos_sales_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;
ALTER TABLE public.pos_sales ADD CONSTRAINT pos_sales_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id) ON DELETE RESTRICT;
ALTER TABLE public.pos_sales ADD CONSTRAINT pos_sales_sold_by_fkey FOREIGN KEY (sold_by) REFERENCES public.users(id) ON DELETE SET NULL;


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