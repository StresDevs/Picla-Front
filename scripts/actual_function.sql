[
  {
    "schema": "auth",
    "function_name": "email",
    "parameters": "",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION auth.email()\n RETURNS text\n LANGUAGE sql\n STABLE\nAS $function$\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.email', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')\n  )::text\n$function$\n"
  },
  {
    "schema": "auth",
    "function_name": "jwt",
    "parameters": "",
    "return_type": "jsonb",
    "full_definition": "CREATE OR REPLACE FUNCTION auth.jwt()\n RETURNS jsonb\n LANGUAGE sql\n STABLE\nAS $function$\n  select \n    coalesce(\n        nullif(current_setting('request.jwt.claim', true), ''),\n        nullif(current_setting('request.jwt.claims', true), '')\n    )::jsonb\n$function$\n"
  },
  {
    "schema": "auth",
    "function_name": "role",
    "parameters": "",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION auth.role()\n RETURNS text\n LANGUAGE sql\n STABLE\nAS $function$\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.role', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')\n  )::text\n$function$\n"
  },
  {
    "schema": "auth",
    "function_name": "uid",
    "parameters": "",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION auth.uid()\n RETURNS uuid\n LANGUAGE sql\n STABLE\nAS $function$\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.sub', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')\n  )::uuid\n$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "armor",
    "parameters": "bytea",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.armor(bytea)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_armor$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "armor",
    "parameters": "bytea, text[], text[]",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.armor(bytea, text[], text[])\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_armor$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "crypt",
    "parameters": "text, text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.crypt(text, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_crypt$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "dearmor",
    "parameters": "text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.dearmor(text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_dearmor$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "decrypt",
    "parameters": "bytea, bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.decrypt(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_decrypt$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "decrypt_iv",
    "parameters": "bytea, bytea, bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_decrypt_iv$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "digest",
    "parameters": "bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.digest(bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_digest$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "digest",
    "parameters": "text, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.digest(text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_digest$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "encrypt",
    "parameters": "bytea, bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.encrypt(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_encrypt$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "encrypt_iv",
    "parameters": "bytea, bytea, bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_encrypt_iv$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "gen_random_bytes",
    "parameters": "integer",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.gen_random_bytes(integer)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_random_bytes$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "gen_random_uuid",
    "parameters": "",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.gen_random_uuid()\n RETURNS uuid\n LANGUAGE c\n PARALLEL SAFE\nAS '$libdir/pgcrypto', $function$pg_random_uuid$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "gen_salt",
    "parameters": "text, integer",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.gen_salt(text, integer)\n RETURNS text\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_gen_salt_rounds$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "gen_salt",
    "parameters": "text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.gen_salt(text)\n RETURNS text\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_gen_salt$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "grant_pg_cron_access",
    "parameters": "",
    "return_type": "event_trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.grant_pg_cron_access()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  IF EXISTS (\n    SELECT\n    FROM pg_event_trigger_ddl_commands() AS ev\n    JOIN pg_extension AS ext\n    ON ev.objid = ext.oid\n    WHERE ext.extname = 'pg_cron'\n  )\n  THEN\n    grant usage on schema cron to postgres with grant option;\n\n    alter default privileges in schema cron grant all on tables to postgres with grant option;\n    alter default privileges in schema cron grant all on functions to postgres with grant option;\n    alter default privileges in schema cron grant all on sequences to postgres with grant option;\n\n    alter default privileges for user supabase_admin in schema cron grant all\n        on sequences to postgres with grant option;\n    alter default privileges for user supabase_admin in schema cron grant all\n        on tables to postgres with grant option;\n    alter default privileges for user supabase_admin in schema cron grant all\n        on functions to postgres with grant option;\n\n    grant all privileges on all tables in schema cron to postgres with grant option;\n    revoke all on table cron.job from postgres;\n    grant select on table cron.job to postgres with grant option;\n  END IF;\nEND;\n$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "grant_pg_graphql_access",
    "parameters": "",
    "return_type": "event_trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.grant_pg_graphql_access()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    func_is_graphql_resolve bool;\nBEGIN\n    func_is_graphql_resolve = (\n        SELECT n.proname = 'resolve'\n        FROM pg_event_trigger_ddl_commands() AS ev\n        LEFT JOIN pg_catalog.pg_proc AS n\n        ON ev.objid = n.oid\n    );\n\n    IF func_is_graphql_resolve\n    THEN\n        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func\n        DROP FUNCTION IF EXISTS graphql_public.graphql;\n        create or replace function graphql_public.graphql(\n            \"operationName\" text default null,\n            query text default null,\n            variables jsonb default null,\n            extensions jsonb default null\n        )\n            returns jsonb\n            language sql\n        as $$\n            select graphql.resolve(\n                query := query,\n                variables := coalesce(variables, '{}'),\n                \"operationName\" := \"operationName\",\n                extensions := extensions\n            );\n        $$;\n\n        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last\n        -- function in the extension so we need to grant permissions on existing entities AND\n        -- update default permissions to any others that are created after `graphql.resolve`\n        grant usage on schema graphql to postgres, anon, authenticated, service_role;\n        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;\n        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;\n        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;\n        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;\n        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;\n        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;\n\n        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles\n        grant usage on schema graphql_public to postgres with grant option;\n        grant usage on schema graphql to postgres with grant option;\n    END IF;\n\nEND;\n$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "grant_pg_net_access",
    "parameters": "",
    "return_type": "event_trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.grant_pg_net_access()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  IF EXISTS (\n    SELECT 1\n    FROM pg_event_trigger_ddl_commands() AS ev\n    JOIN pg_extension AS ext\n    ON ev.objid = ext.oid\n    WHERE ext.extname = 'pg_net'\n  )\n  THEN\n    IF NOT EXISTS (\n      SELECT 1\n      FROM pg_roles\n      WHERE rolname = 'supabase_functions_admin'\n    )\n    THEN\n      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;\n    END IF;\n\n    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;\n\n    IF EXISTS (\n      SELECT FROM pg_extension\n      WHERE extname = 'pg_net'\n      -- all versions in use on existing projects as of 2025-02-20\n      -- version 0.12.0 onwards don't need these applied\n      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')\n    ) THEN\n      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;\n      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;\n\n      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;\n      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;\n\n      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;\n      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;\n\n      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;\n      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;\n    END IF;\n  END IF;\nEND;\n$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "hmac",
    "parameters": "text, text, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.hmac(text, text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_hmac$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "hmac",
    "parameters": "bytea, bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.hmac(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_hmac$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pg_stat_statements",
    "parameters": "showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone",
    "return_type": "SETOF record",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone)\n RETURNS SETOF record\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pg_stat_statements', $function$pg_stat_statements_1_11$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pg_stat_statements_info",
    "parameters": "OUT dealloc bigint, OUT stats_reset timestamp with time zone",
    "return_type": "record",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone)\n RETURNS record\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pg_stat_statements', $function$pg_stat_statements_info$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pg_stat_statements_reset",
    "parameters": "userid oid, dbid oid, queryid bigint, minmax_only boolean",
    "return_type": "timestamp with time zone",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_reset(userid oid DEFAULT 0, dbid oid DEFAULT 0, queryid bigint DEFAULT 0, minmax_only boolean DEFAULT false)\n RETURNS timestamp with time zone\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pg_stat_statements', $function$pg_stat_statements_reset_1_11$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_armor_headers",
    "parameters": "text, OUT key text, OUT value text",
    "return_type": "SETOF record",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text)\n RETURNS SETOF record\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_armor_headers$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_key_id",
    "parameters": "bytea",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_key_id(bytea)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_key_id_w$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_pub_decrypt",
    "parameters": "bytea, bytea, text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_pub_decrypt",
    "parameters": "bytea, bytea, text, text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_pub_decrypt",
    "parameters": "bytea, bytea",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_pub_decrypt_bytea",
    "parameters": "bytea, bytea, text, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_pub_decrypt_bytea",
    "parameters": "bytea, bytea",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_pub_decrypt_bytea",
    "parameters": "bytea, bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_pub_encrypt",
    "parameters": "text, bytea",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_pub_encrypt",
    "parameters": "text, bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_pub_encrypt_bytea",
    "parameters": "bytea, bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_pub_encrypt_bytea",
    "parameters": "bytea, bytea",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_sym_decrypt",
    "parameters": "bytea, text, text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_sym_decrypt",
    "parameters": "bytea, text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_sym_decrypt_bytea",
    "parameters": "bytea, text, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_sym_decrypt_bytea",
    "parameters": "bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_sym_encrypt",
    "parameters": "text, text, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_sym_encrypt",
    "parameters": "text, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_sym_encrypt_bytea",
    "parameters": "bytea, text, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgp_sym_encrypt_bytea",
    "parameters": "bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgrst_ddl_watch",
    "parameters": "",
    "return_type": "event_trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgrst_ddl_watch()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n  cmd record;\nBEGIN\n  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()\n  LOOP\n    IF cmd.command_tag IN (\n      'CREATE SCHEMA', 'ALTER SCHEMA'\n    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'\n    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'\n    , 'CREATE VIEW', 'ALTER VIEW'\n    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'\n    , 'CREATE FUNCTION', 'ALTER FUNCTION'\n    , 'CREATE TRIGGER'\n    , 'CREATE TYPE', 'ALTER TYPE'\n    , 'CREATE RULE'\n    , 'COMMENT'\n    )\n    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp\n    AND cmd.schema_name is distinct from 'pg_temp'\n    THEN\n      NOTIFY pgrst, 'reload schema';\n    END IF;\n  END LOOP;\nEND; $function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "pgrst_drop_watch",
    "parameters": "",
    "return_type": "event_trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgrst_drop_watch()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n  obj record;\nBEGIN\n  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()\n  LOOP\n    IF obj.object_type IN (\n      'schema'\n    , 'table'\n    , 'foreign table'\n    , 'view'\n    , 'materialized view'\n    , 'function'\n    , 'trigger'\n    , 'type'\n    , 'rule'\n    )\n    AND obj.is_temporary IS false -- no pg_temp objects\n    THEN\n      NOTIFY pgrst, 'reload schema';\n    END IF;\n  END LOOP;\nEND; $function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "set_graphql_placeholder",
    "parameters": "",
    "return_type": "event_trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.set_graphql_placeholder()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\n    DECLARE\n    graphql_is_dropped bool;\n    BEGIN\n    graphql_is_dropped = (\n        SELECT ev.schema_name = 'graphql_public'\n        FROM pg_event_trigger_dropped_objects() AS ev\n        WHERE ev.schema_name = 'graphql_public'\n    );\n\n    IF graphql_is_dropped\n    THEN\n        create or replace function graphql_public.graphql(\n            \"operationName\" text default null,\n            query text default null,\n            variables jsonb default null,\n            extensions jsonb default null\n        )\n            returns jsonb\n            language plpgsql\n        as $$\n            DECLARE\n                server_version float;\n            BEGIN\n                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);\n\n                IF server_version >= 14 THEN\n                    RETURN jsonb_build_object(\n                        'errors', jsonb_build_array(\n                            jsonb_build_object(\n                                'message', 'pg_graphql extension is not enabled.'\n                            )\n                        )\n                    );\n                ELSE\n                    RETURN jsonb_build_object(\n                        'errors', jsonb_build_array(\n                            jsonb_build_object(\n                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'\n                            )\n                        )\n                    );\n                END IF;\n            END;\n        $$;\n    END IF;\n\n    END;\n$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "uuid_generate_v1",
    "parameters": "",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1()\n RETURNS uuid\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v1$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "uuid_generate_v1mc",
    "parameters": "",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1mc()\n RETURNS uuid\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v1mc$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "uuid_generate_v3",
    "parameters": "namespace uuid, name text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v3(namespace uuid, name text)\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v3$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "uuid_generate_v4",
    "parameters": "",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v4()\n RETURNS uuid\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v4$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "uuid_generate_v5",
    "parameters": "namespace uuid, name text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v5(namespace uuid, name text)\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v5$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "uuid_nil",
    "parameters": "",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_nil()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_nil$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "uuid_ns_dns",
    "parameters": "",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_ns_dns()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_ns_dns$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "uuid_ns_oid",
    "parameters": "",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_ns_oid()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_ns_oid$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "uuid_ns_url",
    "parameters": "",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_ns_url()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_ns_url$function$\n"
  },
  {
    "schema": "extensions",
    "function_name": "uuid_ns_x500",
    "parameters": "",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_ns_x500()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_ns_x500$function$\n"
  },
  {
    "schema": "graphql",
    "function_name": "_internal_resolve",
    "parameters": "query text, variables jsonb, \"operationName\" text, extensions jsonb",
    "return_type": "jsonb",
    "full_definition": "CREATE OR REPLACE FUNCTION graphql._internal_resolve(query text, variables jsonb DEFAULT '{}'::jsonb, \"operationName\" text DEFAULT NULL::text, extensions jsonb DEFAULT NULL::jsonb)\n RETURNS jsonb\n LANGUAGE c\nAS '$libdir/pg_graphql', $function$resolve_wrapper$function$\n"
  },
  {
    "schema": "graphql",
    "function_name": "comment_directive",
    "parameters": "comment_ text",
    "return_type": "jsonb",
    "full_definition": "CREATE OR REPLACE FUNCTION graphql.comment_directive(comment_ text)\n RETURNS jsonb\n LANGUAGE sql\n IMMUTABLE\nAS $function$\n    /*\n    comment on column public.account.name is '@graphql.name: myField'\n    */\n    select\n        coalesce(\n            (\n                regexp_match(\n                    comment_,\n                    '@graphql\\((.+)\\)'\n                )\n            )[1]::jsonb,\n            jsonb_build_object()\n        )\n$function$\n"
  },
  {
    "schema": "graphql",
    "function_name": "exception",
    "parameters": "message text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION graphql.exception(message text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nbegin\n    raise exception using errcode='22000', message=message;\nend;\n$function$\n"
  },
  {
    "schema": "graphql",
    "function_name": "get_schema_version",
    "parameters": "",
    "return_type": "integer",
    "full_definition": "CREATE OR REPLACE FUNCTION graphql.get_schema_version()\n RETURNS integer\n LANGUAGE sql\n SECURITY DEFINER\nAS $function$\n    select last_value from graphql.seq_schema_version;\n$function$\n"
  },
  {
    "schema": "graphql",
    "function_name": "increment_schema_version",
    "parameters": "",
    "return_type": "event_trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION graphql.increment_schema_version()\n RETURNS event_trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n    perform pg_catalog.nextval('graphql.seq_schema_version');\nend;\n$function$\n"
  },
  {
    "schema": "graphql",
    "function_name": "resolve",
    "parameters": "query text, variables jsonb, \"operationName\" text, extensions jsonb",
    "return_type": "jsonb",
    "full_definition": "CREATE OR REPLACE FUNCTION graphql.resolve(query text, variables jsonb DEFAULT '{}'::jsonb, \"operationName\" text DEFAULT NULL::text, extensions jsonb DEFAULT NULL::jsonb)\n RETURNS jsonb\n LANGUAGE plpgsql\nAS $function$\ndeclare\n    res jsonb;\n    message_text text;\nbegin\n  begin\n    select graphql._internal_resolve(\"query\" := \"query\",\n                                     \"variables\" := \"variables\",\n                                     \"operationName\" := \"operationName\",\n                                     \"extensions\" := \"extensions\") into res;\n    return res;\n  exception\n    when others then\n    get stacked diagnostics message_text = message_text;\n    return\n    jsonb_build_object('data', null,\n                       'errors', jsonb_build_array(jsonb_build_object('message', message_text)));\n  end;\nend;\n$function$\n"
  },
  {
    "schema": "graphql_public",
    "function_name": "graphql",
    "parameters": "\"operationName\" text, query text, variables jsonb, extensions jsonb",
    "return_type": "jsonb",
    "full_definition": "CREATE OR REPLACE FUNCTION graphql_public.graphql(\"operationName\" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb)\n RETURNS jsonb\n LANGUAGE sql\nAS $function$\n            select graphql.resolve(\n                query := query,\n                variables := coalesce(variables, '{}'),\n                \"operationName\" := \"operationName\",\n                extensions := extensions\n            );\n        $function$\n"
  },
  {
    "schema": "pgbouncer",
    "function_name": "get_auth",
    "parameters": "p_usename text",
    "return_type": "TABLE(username text, password text)",
    "full_definition": "CREATE OR REPLACE FUNCTION pgbouncer.get_auth(p_usename text)\n RETURNS TABLE(username text, password text)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\n  BEGIN\n      RAISE DEBUG 'PgBouncer auth request: %', p_usename;\n\n      RETURN QUERY\n      SELECT\n          rolname::text,\n          CASE WHEN rolvaliduntil < now()\n              THEN null\n              ELSE rolpassword::text\n          END\n      FROM pg_authid\n      WHERE rolname=$1 and rolcanlogin;\n  END;\n  $function$\n"
  },
  {
    "schema": "public",
    "function_name": "admin_update_cash_movement",
    "parameters": "p_movement_id uuid, p_new_amount numeric, p_new_description text, p_reason text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.admin_update_cash_movement(p_movement_id uuid, p_new_amount numeric DEFAULT NULL::numeric, p_new_description text DEFAULT NULL::text, p_reason text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_movement public.cash_movements%rowtype;\r\n  v_user_id uuid;\r\n  v_new_amount numeric(12,2);\r\n  v_new_description text;\r\nBEGIN\r\n  IF NOT public.cash_is_admin() THEN\r\n    RAISE EXCEPTION 'Only admin can edit cash movements';\r\n  END IF;\r\n\r\n  v_user_id := public.current_request_user_id();\r\n\r\n  SELECT *\r\n  INTO v_movement\r\n  FROM public.cash_movements m\r\n  WHERE m.id = p_movement_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Cash movement not found';\r\n  END IF;\r\n\r\n  v_new_amount := coalesce(p_new_amount, v_movement.amount);\r\n  IF v_new_amount <= 0 THEN\r\n    RAISE EXCEPTION 'Movement amount must be greater than zero';\r\n  END IF;\r\n\r\n  v_new_description := coalesce(nullif(trim(coalesce(p_new_description, '')), ''), v_movement.description);\r\n\r\n  IF v_new_amount = v_movement.amount AND v_new_description = v_movement.description THEN\r\n    RETURN v_movement.id;\r\n  END IF;\r\n\r\n  UPDATE public.cash_movements\r\n  SET\r\n    amount = v_new_amount,\r\n    description = v_new_description,\r\n    updated_by = v_user_id,\r\n    updated_at = now()\r\n  WHERE id = v_movement.id;\r\n\r\n  INSERT INTO public.cash_movement_edit_logs (\r\n    movement_id,\r\n    request_id,\r\n    branch_id,\r\n    changed_by,\r\n    change_type,\r\n    change_reason,\r\n    old_amount,\r\n    new_amount,\r\n    old_description,\r\n    new_description,\r\n    created_at\r\n  )\r\n  VALUES (\r\n    v_movement.id,\r\n    NULL,\r\n    v_movement.branch_id,\r\n    v_user_id,\r\n    'admin_direct',\r\n    coalesce(nullif(trim(coalesce(p_reason, '')), ''), 'Edicion directa de admin'),\r\n    v_movement.amount,\r\n    v_new_amount,\r\n    v_movement.description,\r\n    v_new_description,\r\n    now()\r\n  );\r\n\r\n  RETURN v_movement.id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "apply_inventory_delta",
    "parameters": "p_part_id uuid, p_branch_id uuid, p_delta numeric, p_reason text, p_movement_type text, p_reference_table text, p_reference_id uuid, p_metadata jsonb",
    "return_type": "void",
    "full_definition": "CREATE OR REPLACE FUNCTION public.apply_inventory_delta(p_part_id uuid, p_branch_id uuid, p_delta numeric, p_reason text, p_movement_type text, p_reference_table text, p_reference_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_inventory public.inventory%rowtype;\r\n  v_before numeric(12, 3);\r\n  v_after numeric(12, 3);\r\n  v_reserved numeric(12, 3);\r\nbegin\r\n  if p_delta = 0 then\r\n    return;\r\n  end if;\r\n\r\n  select *\r\n  into v_inventory\r\n  from public.inventory i\r\n  where i.part_id = p_part_id\r\n    and i.branch_id = p_branch_id\r\n  for update;\r\n\r\n  if not found then\r\n    if p_delta < 0 then\r\n      raise exception 'No existe inventario para descontar en la sucursal %', p_branch_id;\r\n    end if;\r\n\r\n    insert into public.inventory (\r\n      part_id,\r\n      branch_id,\r\n      quantity,\r\n      min_quantity,\r\n      last_restock\r\n    )\r\n    values (\r\n      p_part_id,\r\n      p_branch_id,\r\n      0,\r\n      0,\r\n      case when p_delta > 0 then now() else null end\r\n    )\r\n    returning * into v_inventory;\r\n  end if;\r\n\r\n  v_before := coalesce(v_inventory.quantity, 0);\r\n  v_after := v_before + p_delta;\r\n\r\n  if v_after < 0 then\r\n    raise exception 'Stock insuficiente para el producto % en la sucursal %', p_part_id, p_branch_id;\r\n  end if;\r\n\r\n  if p_delta < 0 then\r\n    v_reserved := coalesce(\r\n      public.get_reserved_inventory_quantity(\r\n        p_part_id,\r\n        p_branch_id,\r\n        case\r\n          when p_reference_table = 'inventory_transfer_requests'\r\n            and p_movement_type = 'traspaso_salida'\r\n          then p_reference_id\r\n          else null\r\n        end\r\n      ),\r\n      0\r\n    );\r\n\r\n    if v_after < v_reserved then\r\n      raise exception\r\n        'Stock comprometido por traspasos pendientes para el producto % en la sucursal %. Stock actual %, reservado %, solicitado %',\r\n        p_part_id,\r\n        p_branch_id,\r\n        v_before,\r\n        v_reserved,\r\n        abs(p_delta);\r\n    end if;\r\n  end if;\r\n\r\n  update public.inventory\r\n  set\r\n    quantity = v_after,\r\n    last_restock = case when p_delta > 0 then now() else last_restock end,\r\n    updated_at = now()\r\n  where id = v_inventory.id;\r\n\r\n  insert into public.inventory_movement_history (\r\n    branch_id,\r\n    part_id,\r\n    movement_type,\r\n    quantity,\r\n    quantity_before,\r\n    quantity_after,\r\n    reason,\r\n    reference_table,\r\n    reference_id,\r\n    created_by,\r\n    metadata\r\n  )\r\n  values (\r\n    p_branch_id,\r\n    p_part_id,\r\n    p_movement_type,\r\n    abs(p_delta),\r\n    v_before,\r\n    v_after,\r\n    coalesce(nullif(trim(p_reason), ''), 'Movimiento de inventario'),\r\n    p_reference_table,\r\n    p_reference_id,\r\n    auth.uid(),\r\n    coalesce(p_metadata, '{}'::jsonb)\r\n  );\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "apply_inventory_transfer_resolution",
    "parameters": "p_transfer_id uuid, p_action text, p_reason text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.apply_inventory_transfer_resolution(p_transfer_id uuid, p_action text, p_reason text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_transfer public.inventory_transfer_requests%rowtype;\r\n  v_item record;\r\n  v_action text;\r\n  v_reason text;\r\n  v_status text;\r\n  v_destination_part_id uuid;\r\nbegin\r\n  if not public.inventory_has_management_access() then\r\n    raise exception 'Only admin or manager can apply transfer actions';\r\n  end if;\r\n\r\n  v_action := lower(coalesce(trim(p_action), ''));\r\n  if v_action not in ('anulacion', 'devolucion', 'reposicion') then\r\n    raise exception 'Invalid action. Use anulacion, devolucion or reposicion';\r\n  end if;\r\n\r\n  select *\r\n  into v_transfer\r\n  from public.inventory_transfer_requests r\r\n  where r.id = p_transfer_id\r\n  for update;\r\n\r\n  if not found then\r\n    raise exception 'Transfer not found';\r\n  end if;\r\n\r\n  if v_transfer.status in ('anulled', 'returned', 'replenished') then\r\n    raise exception 'Transfer already resolved with status %', v_transfer.status;\r\n  end if;\r\n\r\n  if v_action in ('devolucion', 'reposicion') and v_transfer.status <> 'completed' then\r\n    raise exception 'Action % requires transfer status completed', v_action;\r\n  end if;\r\n\r\n  if not public.inventory_is_admin()\r\n     and v_transfer.from_branch_id <> public.current_user_branch_id()\r\n     and v_transfer.to_branch_id <> public.current_user_branch_id() then\r\n    raise exception 'No permission for this transfer';\r\n  end if;\r\n\r\n  v_reason := coalesce(nullif(trim(p_reason), ''), 'Accion aplicada sobre traspaso');\r\n\r\n  if v_action = 'anulacion' then\r\n    update public.inventory_transfer_request_items\r\n    set\r\n      reserved_quantity = 0,\r\n      updated_at = now()\r\n    where transfer_id = p_transfer_id\r\n      and reserved_quantity <> 0;\r\n  elsif v_action = 'devolucion' then\r\n    for v_item in\r\n      select i.id, i.part_id, i.quantity, i.destination_part_id\r\n      from public.inventory_transfer_request_items i\r\n      where i.transfer_id = p_transfer_id\r\n    loop\r\n      v_destination_part_id := coalesce(\r\n        v_item.destination_part_id,\r\n        public.ensure_transfer_destination_part(\r\n          v_item.part_id,\r\n          v_transfer.from_branch_id,\r\n          v_transfer.to_branch_id\r\n        )\r\n      );\r\n\r\n      if v_item.destination_part_id is distinct from v_destination_part_id then\r\n        update public.inventory_transfer_request_items\r\n        set\r\n          destination_part_id = v_destination_part_id,\r\n          updated_at = now()\r\n        where id = v_item.id;\r\n      end if;\r\n\r\n      perform public.apply_inventory_delta(\r\n        v_destination_part_id,\r\n        v_transfer.to_branch_id,\r\n        -v_item.quantity,\r\n        v_reason,\r\n        'devolucion',\r\n        'inventory_transfer_requests',\r\n        p_transfer_id,\r\n        jsonb_build_object('direction', 'salida', 'part_id', v_destination_part_id)\r\n      );\r\n\r\n      perform public.apply_inventory_delta(\r\n        v_item.part_id,\r\n        v_transfer.from_branch_id,\r\n        v_item.quantity,\r\n        v_reason,\r\n        'devolucion',\r\n        'inventory_transfer_requests',\r\n        p_transfer_id,\r\n        jsonb_build_object('direction', 'ingreso', 'part_id', v_item.part_id)\r\n      );\r\n    end loop;\r\n  elsif v_action = 'reposicion' then\r\n    for v_item in\r\n      select i.id, i.part_id, i.quantity, i.destination_part_id\r\n      from public.inventory_transfer_request_items i\r\n      where i.transfer_id = p_transfer_id\r\n    loop\r\n      v_destination_part_id := coalesce(\r\n        v_item.destination_part_id,\r\n        public.ensure_transfer_destination_part(\r\n          v_item.part_id,\r\n          v_transfer.from_branch_id,\r\n          v_transfer.to_branch_id\r\n        )\r\n      );\r\n\r\n      if v_item.destination_part_id is distinct from v_destination_part_id then\r\n        update public.inventory_transfer_request_items\r\n        set\r\n          destination_part_id = v_destination_part_id,\r\n          updated_at = now()\r\n        where id = v_item.id;\r\n      end if;\r\n\r\n      perform public.apply_inventory_delta(\r\n        v_item.part_id,\r\n        v_transfer.from_branch_id,\r\n        -v_item.quantity,\r\n        v_reason,\r\n        'reposicion',\r\n        'inventory_transfer_requests',\r\n        p_transfer_id,\r\n        jsonb_build_object('direction', 'salida', 'part_id', v_item.part_id)\r\n      );\r\n\r\n      perform public.apply_inventory_delta(\r\n        v_destination_part_id,\r\n        v_transfer.to_branch_id,\r\n        v_item.quantity,\r\n        v_reason,\r\n        'reposicion',\r\n        'inventory_transfer_requests',\r\n        p_transfer_id,\r\n        jsonb_build_object('direction', 'ingreso', 'part_id', v_destination_part_id)\r\n      );\r\n    end loop;\r\n  end if;\r\n\r\n  v_status := case v_action\r\n    when 'anulacion' then 'anulled'\r\n    when 'devolucion' then 'returned'\r\n    else 'replenished'\r\n  end;\r\n\r\n  update public.inventory_transfer_requests\r\n  set\r\n    status = v_status,\r\n    resolved_by = auth.uid(),\r\n    resolved_at = now(),\r\n    resolution_type = v_action,\r\n    resolution_reason = v_reason,\r\n    updated_at = now()\r\n  where id = p_transfer_id;\r\n\r\n  insert into public.inventory_transfer_action_history (\r\n    transfer_id,\r\n    action_type,\r\n    reason,\r\n    performed_by,\r\n    details\r\n  )\r\n  values (\r\n    p_transfer_id,\r\n    v_action,\r\n    v_reason,\r\n    auth.uid(),\r\n    jsonb_build_object('status', v_status)\r\n  );\r\n\r\n  return p_transfer_id;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "audit_trigger",
    "parameters": "",
    "return_type": "trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION public.audit_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_actor uuid;\r\n  v_branch uuid;\r\n  v_entity_id uuid;\r\nBEGIN\r\n  v_actor := public.current_request_user_id();\r\n\r\n  IF tg_table_name = 'branches' THEN\r\n    v_branch := COALESCE(NEW.id, OLD.id);\r\n  ELSIF tg_table_name = 'users' THEN\r\n    v_branch := COALESCE(NEW.branch_id, OLD.branch_id);\r\n  ELSE\r\n    v_branch := NULL;\r\n  END IF;\r\n\r\n  IF tg_op = 'INSERT' THEN\r\n    IF to_jsonb(NEW) ? 'id' THEN\r\n      v_entity_id := (to_jsonb(NEW) ->> 'id')::uuid;\r\n    ELSE\r\n      v_entity_id := NULL;\r\n    END IF;\r\n\r\n    INSERT INTO public.audit_logs (actor_user_id, branch_id, action, entity_table, entity_id, old_data, new_data, metadata)\r\n    VALUES (v_actor, v_branch, 'insert', tg_table_name, v_entity_id, NULL, to_jsonb(NEW), NULL);\r\n\r\n    RETURN NEW;\r\n  ELSIF tg_op = 'UPDATE' THEN\r\n    IF to_jsonb(NEW) ? 'id' THEN\r\n      v_entity_id := (to_jsonb(NEW) ->> 'id')::uuid;\r\n    ELSE\r\n      v_entity_id := NULL;\r\n    END IF;\r\n\r\n    INSERT INTO public.audit_logs (actor_user_id, branch_id, action, entity_table, entity_id, old_data, new_data, metadata)\r\n    VALUES (v_actor, v_branch, 'update', tg_table_name, v_entity_id, to_jsonb(OLD), to_jsonb(NEW), NULL);\r\n\r\n    RETURN NEW;\r\n  ELSIF tg_op = 'DELETE' THEN\r\n    IF to_jsonb(OLD) ? 'id' THEN\r\n      v_entity_id := (to_jsonb(OLD) ->> 'id')::uuid;\r\n    ELSE\r\n      v_entity_id := NULL;\r\n    END IF;\r\n\r\n    INSERT INTO public.audit_logs (actor_user_id, branch_id, action, entity_table, entity_id, old_data, new_data, metadata)\r\n    VALUES (v_actor, v_branch, 'delete', tg_table_name, v_entity_id, to_jsonb(OLD), NULL, NULL);\r\n\r\n    RETURN OLD;\r\n  END IF;\r\n\r\n  RETURN NULL;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "billing_claim_invoice_jobs",
    "parameters": "p_limit integer",
    "return_type": "TABLE(job_id uuid, sale_id uuid, payload jsonb, attempt_count integer, max_attempts integer)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.billing_claim_invoice_jobs(p_limit integer DEFAULT 10)\n RETURNS TABLE(job_id uuid, sale_id uuid, payload jsonb, attempt_count integer, max_attempts integer)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nBEGIN\r\n  IF auth.role() <> 'service_role' THEN\r\n    RAISE EXCEPTION 'Only service_role can claim billing jobs';\r\n  END IF;\r\n\r\n  RETURN QUERY\r\n  WITH claim AS (\r\n    SELECT j.id\r\n    FROM public.billing_invoice_jobs j\r\n    WHERE j.status IN ('queued', 'retry', 'contingency')\r\n      AND j.next_run_at <= now()\r\n    ORDER BY j.created_at ASC\r\n    FOR UPDATE SKIP LOCKED\r\n    LIMIT GREATEST(coalesce(p_limit, 10), 1)\r\n  ), upd AS (\r\n    UPDATE public.billing_invoice_jobs j\r\n    SET\r\n      status = 'processing',\r\n      attempt_count = j.attempt_count + 1,\r\n      updated_at = now()\r\n    FROM claim c\r\n    WHERE j.id = c.id\r\n    RETURNING j.id, j.sale_id, j.payload, j.attempt_count, j.max_attempts\r\n  )\r\n  SELECT upd.id, upd.sale_id, upd.payload, upd.attempt_count, upd.max_attempts\r\n  FROM upd;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "billing_mark_invoice_job",
    "parameters": "p_job_id uuid, p_success boolean, p_error text, p_response jsonb, p_artifacts jsonb, p_http_status integer, p_response_code text",
    "return_type": "void",
    "full_definition": "CREATE OR REPLACE FUNCTION public.billing_mark_invoice_job(p_job_id uuid, p_success boolean, p_error text DEFAULT NULL::text, p_response jsonb DEFAULT '{}'::jsonb, p_artifacts jsonb DEFAULT '[]'::jsonb, p_http_status integer DEFAULT NULL::integer, p_response_code text DEFAULT NULL::text)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_job public.billing_invoice_jobs%rowtype;\r\n  v_next_status text;\r\n  v_next_run timestamptz;\r\n  v_artifact jsonb;\r\nBEGIN\r\n  IF auth.role() <> 'service_role' THEN\r\n    RAISE EXCEPTION 'Only service_role can mark billing jobs';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_job\r\n  FROM public.billing_invoice_jobs j\r\n  WHERE j.id = p_job_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Billing job not found';\r\n  END IF;\r\n\r\n  INSERT INTO public.billing_invoice_attempts (\r\n    job_id,\r\n    sale_id,\r\n    attempt_number,\r\n    request_payload,\r\n    response_payload,\r\n    response_http_status,\r\n    response_code,\r\n    error_message,\r\n    created_at\r\n  )\r\n  VALUES (\r\n    v_job.id,\r\n    v_job.sale_id,\r\n    GREATEST(v_job.attempt_count, 1),\r\n    v_job.payload,\r\n    coalesce(p_response, '{}'::jsonb),\r\n    p_http_status,\r\n    p_response_code,\r\n    nullif(trim(coalesce(p_error, '')), ''),\r\n    now()\r\n  );\r\n\r\n  IF p_success THEN\r\n    v_next_status := 'completed';\r\n    v_next_run := NULL;\r\n\r\n    UPDATE public.pos_sales\r\n    SET\r\n      siat_status = 'authorized',\r\n      siat_authorized_at = now(),\r\n      siat_response = coalesce(p_response, '{}'::jsonb),\r\n      updated_at = now()\r\n    WHERE id = v_job.sale_id;\r\n  ELSE\r\n    IF v_job.attempt_count < v_job.max_attempts THEN\r\n      v_next_status := 'retry';\r\n      v_next_run := now() + make_interval(mins => LEAST(60, GREATEST(2, v_job.attempt_count * 2)));\r\n\r\n      UPDATE public.pos_sales\r\n      SET\r\n        siat_status = 'contingency_pending',\r\n        siat_response = jsonb_build_object(\r\n          'last_error', p_error,\r\n          'last_response', p_response,\r\n          'attempt_count', v_job.attempt_count\r\n        ),\r\n        updated_at = now()\r\n      WHERE id = v_job.sale_id;\r\n    ELSE\r\n      v_next_status := 'failed';\r\n      v_next_run := NULL;\r\n\r\n      UPDATE public.pos_sales\r\n      SET\r\n        siat_status = 'rejected',\r\n        siat_response = jsonb_build_object(\r\n          'last_error', p_error,\r\n          'last_response', p_response,\r\n          'attempt_count', v_job.attempt_count\r\n        ),\r\n        updated_at = now()\r\n      WHERE id = v_job.sale_id;\r\n    END IF;\r\n  END IF;\r\n\r\n  UPDATE public.billing_invoice_jobs\r\n  SET\r\n    status = v_next_status,\r\n    last_error = nullif(trim(coalesce(p_error, '')), ''),\r\n    next_run_at = coalesce(v_next_run, next_run_at),\r\n    processed_at = CASE WHEN v_next_status = 'completed' THEN now() ELSE processed_at END,\r\n    updated_at = now()\r\n  WHERE id = v_job.id;\r\n\r\n  IF jsonb_typeof(coalesce(p_artifacts, '[]'::jsonb)) = 'array' THEN\r\n    FOR v_artifact IN SELECT * FROM jsonb_array_elements(coalesce(p_artifacts, '[]'::jsonb))\r\n    LOOP\r\n      INSERT INTO public.billing_invoice_artifacts (\r\n        sale_id,\r\n        artifact_type,\r\n        storage_path,\r\n        content_text,\r\n        content_hash,\r\n        metadata,\r\n        created_at\r\n      )\r\n      VALUES (\r\n        v_job.sale_id,\r\n        coalesce(v_artifact->>'artifact_type', 'siat_response'),\r\n        nullif(v_artifact->>'storage_path', ''),\r\n        nullif(v_artifact->>'content_text', ''),\r\n        nullif(v_artifact->>'content_hash', ''),\r\n        coalesce(v_artifact->'metadata', '{}'::jsonb),\r\n        now()\r\n      );\r\n    END LOOP;\r\n  END IF;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "bulk_upsert_inventory_products",
    "parameters": "p_rows jsonb",
    "return_type": "TABLE(row_index integer, part_id uuid, status text, message text)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.bulk_upsert_inventory_products(p_rows jsonb)\n RETURNS TABLE(row_index integer, part_id uuid, status text, message text)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_row jsonb;\r\n  v_index integer := 0;\r\n  v_part_id uuid;\r\nbegin\r\n  if not public.inventory_is_admin() then\r\n    raise exception 'Only admin can run bulk product upload';\r\n  end if;\r\n\r\n  if jsonb_typeof(p_rows) <> 'array' then\r\n    raise exception 'p_rows must be a JSON array';\r\n  end if;\r\n\r\n  for v_row in select * from jsonb_array_elements(p_rows)\r\n  loop\r\n    begin\r\n      v_part_id := public.upsert_inventory_product(\r\n        (v_row->>'branch_id')::uuid,\r\n        coalesce(v_row->>'code', ''),\r\n        coalesce(v_row->>'name', ''),\r\n        v_row->>'description',\r\n        v_row->>'category',\r\n        nullif(v_row->>'category_id', '')::uuid,\r\n        v_row->>'image_url',\r\n        coalesce((v_row->>'cost')::numeric, 0),\r\n        coalesce((v_row->>'price')::numeric, 0),\r\n        coalesce((v_row->>'kit_price')::numeric, 0),\r\n        nullif(v_row->>'quotation_min_price', '')::numeric,\r\n        nullif(v_row->>'quotation_max_price', '')::numeric,\r\n        coalesce(v_row->>'tracking_mode', 'none'),\r\n        coalesce((v_row->>'requires_serialization')::boolean, false),\r\n        coalesce((v_row->>'initial_quantity')::numeric, 0),\r\n        coalesce((v_row->>'min_quantity')::numeric, 0),\r\n        nullif(v_row->>'max_quantity', '')::numeric,\r\n        coalesce(v_row->'price_tiers', '[]'::jsonb)\r\n      );\r\n\r\n      row_index := v_index;\r\n      part_id := v_part_id;\r\n      status := 'ok';\r\n      message := 'processed';\r\n      return next;\r\n    exception when others then\r\n      row_index := v_index;\r\n      part_id := null;\r\n      status := 'error';\r\n      message := sqlerrm;\r\n      return next;\r\n    end;\r\n\r\n    v_index := v_index + 1;\r\n  end loop;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "can_process_sales_inventory_flow",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.can_process_sales_inventory_flow()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select coalesce(public.current_user_role_name() in ('admin', 'manager', 'employee'), false)\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "capture_cash_inventory_snapshot",
    "parameters": "p_cash_session_id uuid, p_snapshot_type text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.capture_cash_inventory_snapshot(p_cash_session_id uuid, p_snapshot_type text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_session public.cash_sessions%rowtype;\r\n  v_snapshot_type text;\r\n  v_snapshot_id uuid;\r\nBEGIN\r\n  v_snapshot_type := lower(coalesce(trim(p_snapshot_type), ''));\r\n  IF v_snapshot_type NOT IN ('open', 'close') THEN\r\n    RAISE EXCEPTION 'Invalid snapshot type. Use open or close';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_session\r\n  FROM public.cash_sessions s\r\n  WHERE s.id = p_cash_session_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Cash session not found';\r\n  END IF;\r\n\r\n  INSERT INTO public.cash_inventory_snapshots (\r\n    cash_session_id,\r\n    branch_id,\r\n    snapshot_type,\r\n    item_count,\r\n    total_units,\r\n    taken_by,\r\n    taken_at\r\n  )\r\n  SELECT\r\n    v_session.id,\r\n    v_session.branch_id,\r\n    v_snapshot_type,\r\n    count(*)::int,\r\n    coalesce(sum(i.quantity), 0)::numeric(12, 3),\r\n    public.current_request_user_id(),\r\n    now()\r\n  FROM public.inventory i\r\n  WHERE i.branch_id = v_session.branch_id\r\n  RETURNING id INTO v_snapshot_id;\r\n\r\n  INSERT INTO public.cash_inventory_snapshot_items (\r\n    snapshot_id,\r\n    part_id,\r\n    part_code,\r\n    part_name,\r\n    quantity\r\n  )\r\n  SELECT\r\n    v_snapshot_id,\r\n    i.part_id,\r\n    p.code,\r\n    p.name,\r\n    i.quantity\r\n  FROM public.inventory i\r\n  JOIN public.parts p ON p.id = i.part_id\r\n  WHERE i.branch_id = v_session.branch_id;\r\n\r\n  RETURN v_snapshot_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "cash_can_access_branch",
    "parameters": "p_branch_id uuid",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.cash_can_access_branch(p_branch_id uuid)\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select coalesce(\r\n    public.cash_is_admin()\r\n    or (\r\n      public.cash_current_role_name() in ('manager', 'employee')\r\n      and public.current_user_branch_id() = p_branch_id\r\n    ),\r\n    false\r\n  )\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "cash_can_create_manual_movement",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.cash_can_create_manual_movement()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select public.cash_current_role_name() in ('admin', 'manager')\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "cash_can_open_close",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.cash_can_open_close()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select public.cash_current_role_name() in ('admin', 'manager', 'employee')\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "cash_can_request_movement_edit",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.cash_can_request_movement_edit()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select public.cash_current_role_name() in ('admin', 'manager')\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "cash_current_role_name",
    "parameters": "",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION public.cash_current_role_name()\n RETURNS text\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select coalesce(public.current_user_role_name(), '')\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "cash_is_admin",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.cash_is_admin()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select public.cash_current_role_name() = 'admin'\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "cash_is_employee",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.cash_is_employee()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select public.cash_current_role_name() = 'employee'\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "cash_is_manager",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.cash_is_manager()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select public.cash_current_role_name() = 'manager'\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "close_cash_session",
    "parameters": "p_cash_session_id uuid, p_closing_amount_counted numeric, p_closing_notes text",
    "return_type": "TABLE(cash_session_id uuid, expected_amount numeric, counted_amount numeric, variance numeric)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.close_cash_session(p_cash_session_id uuid, p_closing_amount_counted numeric, p_closing_notes text DEFAULT NULL::text)\n RETURNS TABLE(cash_session_id uuid, expected_amount numeric, counted_amount numeric, variance numeric)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_session public.cash_sessions%rowtype;\r\n  v_user_id uuid;\r\n  v_manual_income numeric(12, 2);\r\n  v_manual_expense numeric(12, 2);\r\n  v_sales_cash numeric(12, 2);\r\n  v_sales_return_cash numeric(12, 2);\r\n  v_expected numeric(12, 2);\r\n  v_variance numeric(12, 2);\r\nBEGIN\r\n  IF NOT public.cash_can_open_close() THEN\r\n    RAISE EXCEPTION 'Only admin, manager or employee can close cash sessions';\r\n  END IF;\r\n\r\n  IF p_closing_amount_counted IS NULL OR p_closing_amount_counted < 0 THEN\r\n    RAISE EXCEPTION 'Closing counted amount must be greater or equal to zero';\r\n  END IF;\r\n\r\n  v_user_id := public.current_request_user_id();\r\n  IF v_user_id IS NULL THEN\r\n    RAISE EXCEPTION 'No hay sesión autenticada para cierre de caja.';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_session\r\n  FROM public.cash_sessions s\r\n  WHERE s.id = p_cash_session_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Cash session not found';\r\n  END IF;\r\n\r\n  IF v_session.status <> 'open' THEN\r\n    RAISE EXCEPTION 'Cash session is already closed';\r\n  END IF;\r\n\r\n  IF NOT public.cash_can_access_branch(v_session.branch_id) THEN\r\n    RAISE EXCEPTION 'No permission for selected branch cash session';\r\n  END IF;\r\n\r\n  SELECT\r\n    coalesce(sum(CASE WHEN movement_type = 'manual_income' THEN amount ELSE 0 END), 0)::numeric(12, 2),\r\n    coalesce(sum(CASE WHEN movement_type = 'manual_expense' THEN amount ELSE 0 END), 0)::numeric(12, 2),\r\n    coalesce(sum(CASE WHEN movement_type = 'sale_cash' THEN amount ELSE 0 END), 0)::numeric(12, 2),\r\n    coalesce(sum(CASE WHEN movement_type = 'sale_return_cash' THEN amount ELSE 0 END), 0)::numeric(12, 2)\r\n  INTO v_manual_income, v_manual_expense, v_sales_cash, v_sales_return_cash\r\n  FROM public.cash_movements m\r\n  WHERE m.cash_session_id = v_session.id;\r\n\r\n  v_expected := (\r\n    v_session.opening_amount\r\n    + v_sales_cash\r\n    + v_manual_income\r\n    - v_manual_expense\r\n    - v_sales_return_cash\r\n  )::numeric(12, 2);\r\n\r\n  v_variance := (p_closing_amount_counted - v_expected)::numeric(12, 2);\r\n\r\n  UPDATE public.cash_sessions\r\n  SET\r\n    status = 'closed',\r\n    expected_closing_amount = v_expected,\r\n    closing_amount_counted = p_closing_amount_counted,\r\n    variance_amount = v_variance,\r\n    closed_by = v_user_id,\r\n    closing_notes = nullif(trim(coalesce(p_closing_notes, '')), ''),\r\n    closed_at = now(),\r\n    updated_at = now()\r\n  WHERE id = v_session.id;\r\n\r\n  PERFORM public.capture_cash_inventory_snapshot(v_session.id, 'close');\r\n\r\n  RETURN QUERY\r\n  SELECT v_session.id, v_expected, p_closing_amount_counted::numeric(12, 2), v_variance;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "complete_inventory_transfer_request",
    "parameters": "p_transfer_id uuid, p_reason text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.complete_inventory_transfer_request(p_transfer_id uuid, p_reason text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_transfer public.inventory_transfer_requests%rowtype;\r\n  v_item record;\r\n  v_reason text;\r\n  v_destination_part_id uuid;\r\n  v_origin_inventory public.inventory%rowtype;\r\n  v_reserved numeric(12, 3);\r\n  v_available numeric(12, 3);\r\nbegin\r\n  if not public.inventory_has_management_access() then\r\n    raise exception 'Only admin or manager can complete transfers';\r\n  end if;\r\n\r\n  select *\r\n  into v_transfer\r\n  from public.inventory_transfer_requests r\r\n  where r.id = p_transfer_id\r\n  for update;\r\n\r\n  if not found then\r\n    raise exception 'Transfer not found';\r\n  end if;\r\n\r\n  if v_transfer.status <> 'pending' then\r\n    raise exception 'Only pending transfers can be completed';\r\n  end if;\r\n\r\n  if not public.inventory_is_admin() and v_transfer.to_branch_id <> public.current_user_branch_id() then\r\n    raise exception 'Manager can only complete transfers for own branch destination';\r\n  end if;\r\n\r\n  v_reason := coalesce(nullif(trim(p_reason), ''), 'Traspaso completado');\r\n\r\n  for v_item in\r\n    select i.id, i.part_id, i.quantity, i.destination_part_id, i.reserved_quantity\r\n    from public.inventory_transfer_request_items i\r\n    where i.transfer_id = p_transfer_id\r\n    for update\r\n  loop\r\n    -- Compatibilidad con pendientes legacy sin reserva: intenta reservar antes de completar.\r\n    if coalesce(v_item.reserved_quantity, 0) < v_item.quantity then\r\n      select *\r\n      into v_origin_inventory\r\n      from public.inventory inv\r\n      where inv.part_id = v_item.part_id\r\n        and inv.branch_id = v_transfer.from_branch_id\r\n      for update;\r\n\r\n      if not found then\r\n        raise exception 'No existe inventario para descontar en la sucursal %', v_transfer.from_branch_id;\r\n      end if;\r\n\r\n      v_reserved := coalesce(\r\n        public.get_reserved_inventory_quantity(\r\n          v_item.part_id,\r\n          v_transfer.from_branch_id,\r\n          p_transfer_id\r\n        ),\r\n        0\r\n      );\r\n      v_available := coalesce(v_origin_inventory.quantity, 0) - v_reserved;\r\n\r\n      if v_available < v_item.quantity then\r\n        raise exception 'Stock insuficiente para el producto % en la sucursal %', v_item.part_id, v_transfer.from_branch_id;\r\n      end if;\r\n\r\n      update public.inventory_transfer_request_items\r\n      set\r\n        reserved_quantity = v_item.quantity,\r\n        updated_at = now()\r\n      where id = v_item.id;\r\n    end if;\r\n\r\n    -- Libera reserva en el mismo tx antes de aplicar la salida real.\r\n    update public.inventory_transfer_request_items\r\n    set\r\n      reserved_quantity = 0,\r\n      updated_at = now()\r\n    where id = v_item.id\r\n      and reserved_quantity <> 0;\r\n\r\n    v_destination_part_id := coalesce(\r\n      v_item.destination_part_id,\r\n      public.ensure_transfer_destination_part(\r\n        v_item.part_id,\r\n        v_transfer.from_branch_id,\r\n        v_transfer.to_branch_id\r\n      )\r\n    );\r\n\r\n    if v_item.destination_part_id is distinct from v_destination_part_id then\r\n      update public.inventory_transfer_request_items\r\n      set\r\n        destination_part_id = v_destination_part_id,\r\n        updated_at = now()\r\n      where id = v_item.id;\r\n    end if;\r\n\r\n    perform public.apply_inventory_delta(\r\n      v_item.part_id,\r\n      v_transfer.from_branch_id,\r\n      -v_item.quantity,\r\n      v_reason,\r\n      'traspaso_salida',\r\n      'inventory_transfer_requests',\r\n      p_transfer_id,\r\n      jsonb_build_object('to_branch_id', v_transfer.to_branch_id, 'from_part_id', v_item.part_id)\r\n    );\r\n\r\n    perform public.apply_inventory_delta(\r\n      v_destination_part_id,\r\n      v_transfer.to_branch_id,\r\n      v_item.quantity,\r\n      v_reason,\r\n      'traspaso_ingreso',\r\n      'inventory_transfer_requests',\r\n      p_transfer_id,\r\n      jsonb_build_object('from_branch_id', v_transfer.from_branch_id, 'to_part_id', v_destination_part_id)\r\n    );\r\n  end loop;\r\n\r\n  update public.inventory_transfer_requests\r\n  set\r\n    status = 'completed',\r\n    resolved_by = auth.uid(),\r\n    resolved_at = now(),\r\n    resolution_type = null,\r\n    resolution_reason = v_reason,\r\n    updated_at = now()\r\n  where id = p_transfer_id;\r\n\r\n  insert into public.inventory_transfer_action_history (\r\n    transfer_id,\r\n    action_type,\r\n    reason,\r\n    performed_by,\r\n    details\r\n  )\r\n  values (\r\n    p_transfer_id,\r\n    'completado',\r\n    v_reason,\r\n    auth.uid(),\r\n    '{}'::jsonb\r\n  );\r\n\r\n  return p_transfer_id;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "create_branch",
    "parameters": "p_name text, p_address text, p_phone text",
    "return_type": "branches",
    "full_definition": "CREATE OR REPLACE FUNCTION public.create_branch(p_name text, p_address text DEFAULT NULL::text, p_phone text DEFAULT NULL::text)\n RETURNS branches\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_branch public.branches;\r\n  v_name text;\r\nBEGIN\r\n  PERFORM public.ensure_admin();\r\n\r\n  v_name := NULLIF(trim(p_name), '');\r\n  IF v_name IS NULL THEN\r\n    RAISE EXCEPTION 'El nombre de la sucursal es obligatorio.';\r\n  END IF;\r\n\r\n  IF EXISTS (\r\n    SELECT 1\r\n    FROM public.branches b\r\n    WHERE lower(trim(b.name)) = lower(v_name)\r\n  ) THEN\r\n    RAISE EXCEPTION 'Ya existe una sucursal con ese nombre.';\r\n  END IF;\r\n\r\n  INSERT INTO public.branches (name, address, phone)\r\n  VALUES (\r\n    v_name,\r\n    NULLIF(trim(COALESCE(p_address, '')), ''),\r\n    NULLIF(trim(COALESCE(p_phone, '')), '')\r\n  )\r\n  RETURNING * INTO v_branch;\r\n\r\n  RETURN v_branch;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "create_cash_manual_movement",
    "parameters": "p_cash_session_id uuid, p_direction text, p_amount numeric, p_description text, p_metadata jsonb",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.create_cash_manual_movement(p_cash_session_id uuid, p_direction text, p_amount numeric, p_description text, p_metadata jsonb DEFAULT '{}'::jsonb)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_session public.cash_sessions%rowtype;\r\n  v_direction text;\r\n  v_movement_type text;\r\n  v_user_id uuid;\r\n  v_movement_id uuid;\r\nBEGIN\r\n  IF NOT public.cash_can_create_manual_movement() THEN\r\n    RAISE EXCEPTION 'Only admin or manager can register manual cash movements';\r\n  END IF;\r\n\r\n  v_user_id := public.current_request_user_id();\r\n  IF v_user_id IS NULL THEN\r\n    RAISE EXCEPTION 'No hay sesión autenticada para registrar movimiento de caja.';\r\n  END IF;\r\n\r\n  v_direction := lower(coalesce(trim(p_direction), ''));\r\n  IF v_direction NOT IN ('income', 'expense') THEN\r\n    RAISE EXCEPTION 'Invalid direction. Use income or expense';\r\n  END IF;\r\n\r\n  IF p_amount IS NULL OR p_amount <= 0 THEN\r\n    RAISE EXCEPTION 'Amount must be greater than zero';\r\n  END IF;\r\n\r\n  IF nullif(trim(coalesce(p_description, '')), '') IS NULL THEN\r\n    RAISE EXCEPTION 'Description is required';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_session\r\n  FROM public.cash_sessions s\r\n  WHERE s.id = p_cash_session_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Cash session not found';\r\n  END IF;\r\n\r\n  IF v_session.status <> 'open' THEN\r\n    RAISE EXCEPTION 'Cash session is already closed';\r\n  END IF;\r\n\r\n  IF NOT public.cash_can_access_branch(v_session.branch_id) THEN\r\n    RAISE EXCEPTION 'No permission for selected branch cash session';\r\n  END IF;\r\n\r\n  v_movement_type := CASE\r\n    WHEN v_direction = 'income' THEN 'manual_income'\r\n    ELSE 'manual_expense'\r\n  END;\r\n\r\n  INSERT INTO public.cash_movements (\r\n    cash_session_id,\r\n    branch_id,\r\n    movement_type,\r\n    amount,\r\n    description,\r\n    payment_method,\r\n    reference_table,\r\n    reference_id,\r\n    created_by,\r\n    updated_by,\r\n    metadata,\r\n    created_at,\r\n    updated_at\r\n  )\r\n  VALUES (\r\n    v_session.id,\r\n    v_session.branch_id,\r\n    v_movement_type,\r\n    p_amount,\r\n    trim(p_description),\r\n    'cash',\r\n    NULL,\r\n    NULL,\r\n    v_user_id,\r\n    v_user_id,\r\n    coalesce(p_metadata, '{}'::jsonb),\r\n    now(),\r\n    now()\r\n  )\r\n  RETURNING id INTO v_movement_id;\r\n\r\n  RETURN v_movement_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "create_cash_movement_edit_request",
    "parameters": "p_movement_id uuid, p_request_reason text, p_proposed_amount numeric, p_proposed_description text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.create_cash_movement_edit_request(p_movement_id uuid, p_request_reason text, p_proposed_amount numeric DEFAULT NULL::numeric, p_proposed_description text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_movement public.cash_movements%rowtype;\r\n  v_request_id uuid;\r\n  v_user_id uuid;\r\n  v_role text;\r\nBEGIN\r\n  IF NOT public.cash_can_request_movement_edit() THEN\r\n    RAISE EXCEPTION 'Only manager or admin can request movement edits';\r\n  END IF;\r\n\r\n  v_user_id := public.current_request_user_id();\r\n  v_role := public.cash_current_role_name();\r\n\r\n  IF nullif(trim(coalesce(p_request_reason, '')), '') IS NULL THEN\r\n    RAISE EXCEPTION 'Request reason is required';\r\n  END IF;\r\n\r\n  IF p_proposed_amount IS NOT NULL AND p_proposed_amount <= 0 THEN\r\n    RAISE EXCEPTION 'Proposed amount must be greater than zero';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_movement\r\n  FROM public.cash_movements m\r\n  WHERE m.id = p_movement_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Cash movement not found';\r\n  END IF;\r\n\r\n  IF v_role = 'manager' AND v_movement.branch_id <> public.current_user_branch_id() THEN\r\n    RAISE EXCEPTION 'Manager can only request edits for own branch movements';\r\n  END IF;\r\n\r\n  INSERT INTO public.cash_movement_edit_requests (\r\n    movement_id,\r\n    cash_session_id,\r\n    branch_id,\r\n    requested_by,\r\n    requested_role,\r\n    request_reason,\r\n    proposed_amount,\r\n    proposed_description,\r\n    status,\r\n    created_at,\r\n    updated_at\r\n  )\r\n  VALUES (\r\n    v_movement.id,\r\n    v_movement.cash_session_id,\r\n    v_movement.branch_id,\r\n    v_user_id,\r\n    v_role,\r\n    trim(p_request_reason),\r\n    p_proposed_amount,\r\n    nullif(trim(coalesce(p_proposed_description, '')), ''),\r\n    'pending',\r\n    now(),\r\n    now()\r\n  )\r\n  RETURNING id INTO v_request_id;\r\n\r\n  RETURN v_request_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "create_inventory_category",
    "parameters": "p_branch_id uuid, p_name text, p_description text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.create_inventory_category(p_branch_id uuid, p_name text, p_description text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_category_id uuid;\r\nbegin\r\n  if not public.inventory_is_admin() then\r\n    raise exception 'Only admin can create categories';\r\n  end if;\r\n\r\n  insert into public.inventory_categories (branch_id, name, description)\r\n  values (p_branch_id, trim(p_name), p_description)\r\n  on conflict (branch_id, name)\r\n  do update set description = excluded.description, updated_at = now()\r\n  returning id into v_category_id;\r\n\r\n  return v_category_id;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "create_inventory_entry",
    "parameters": "p_branch_id uuid, p_part_id uuid, p_quantity numeric, p_reason text, p_source_reference text, p_supplier_name text, p_notes text, p_unit_cost numeric, p_unit_price numeric, p_currency text, p_exchange_rate numeric",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.create_inventory_entry(p_branch_id uuid, p_part_id uuid, p_quantity numeric, p_reason text DEFAULT NULL::text, p_source_reference text DEFAULT NULL::text, p_supplier_name text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_unit_cost numeric DEFAULT NULL::numeric, p_unit_price numeric DEFAULT NULL::numeric, p_currency text DEFAULT 'BOB'::text, p_exchange_rate numeric DEFAULT NULL::numeric)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_entry_id uuid;\r\n  v_currency text;\r\n  v_reason text;\r\n  v_effective_price numeric(12,2);\r\nbegin\r\n  if not public.inventory_is_admin() then\r\n    raise exception 'Only admin can register inventory entries';\r\n  end if;\r\n\r\n  if p_branch_id is null or p_part_id is null then\r\n    raise exception 'Branch and product are required';\r\n  end if;\r\n\r\n  if p_quantity is null or p_quantity <= 0 then\r\n    raise exception 'Quantity must be greater than zero';\r\n  end if;\r\n\r\n  if not exists (\r\n    select 1\r\n    from public.parts p\r\n    where p.id = p_part_id\r\n      and p.branch_id = p_branch_id\r\n  ) then\r\n    raise exception 'Product % does not belong to branch %', p_part_id, p_branch_id;\r\n  end if;\r\n\r\n  if p_unit_cost is not null and p_unit_cost < 0 then\r\n    raise exception 'Unit cost cannot be negative';\r\n  end if;\r\n\r\n  if p_unit_price is not null and p_unit_price < 0 then\r\n    raise exception 'Unit price cannot be negative';\r\n  end if;\r\n\r\n  v_currency := upper(coalesce(nullif(trim(p_currency), ''), 'BOB'));\r\n  if v_currency not in ('BOB', 'USD') then\r\n    raise exception 'Currency must be BOB or USD';\r\n  end if;\r\n\r\n  if v_currency = 'USD' and (p_exchange_rate is null or p_exchange_rate <= 0) then\r\n    raise exception 'Exchange rate is required and must be greater than zero for USD entries';\r\n  end if;\r\n\r\n  v_reason := coalesce(nullif(trim(p_reason), ''), 'Ingreso de mercaderia');\r\n\r\n  insert into public.inventory_entries (\r\n    branch_id,\r\n    part_id,\r\n    quantity,\r\n    unit_cost,\r\n    unit_price,\r\n    currency,\r\n    exchange_rate,\r\n    source_reference,\r\n    supplier_name,\r\n    reason,\r\n    notes,\r\n    created_by\r\n  )\r\n  values (\r\n    p_branch_id,\r\n    p_part_id,\r\n    p_quantity,\r\n    p_unit_cost,\r\n    p_unit_price,\r\n    v_currency,\r\n    case when v_currency = 'USD' then p_exchange_rate else null end,\r\n    nullif(trim(coalesce(p_source_reference, '')), ''),\r\n    nullif(trim(coalesce(p_supplier_name, '')), ''),\r\n    v_reason,\r\n    nullif(trim(coalesce(p_notes, '')), ''),\r\n    auth.uid()\r\n  )\r\n  returning id into v_entry_id;\r\n\r\n  if p_unit_cost is not null or p_unit_price is not null then\r\n    update public.parts\r\n    set\r\n      cost = case\r\n        when p_unit_cost is null then cost\r\n        else round(((coalesce(cost, p_unit_cost) + p_unit_cost) / 2)::numeric, 2)\r\n      end,\r\n      price = case\r\n        when p_unit_price is null then price\r\n        else round(((coalesce(price, p_unit_price) + p_unit_price) / 2)::numeric, 2)\r\n      end,\r\n      updated_by = auth.uid(),\r\n      updated_at = now()\r\n    where id = p_part_id\r\n    returning price into v_effective_price;\r\n\r\n    if p_unit_price is not null then\r\n      insert into public.product_price_tiers (part_id, min_quantity, price)\r\n      values (p_part_id, 1, coalesce(v_effective_price, p_unit_price))\r\n      on conflict (part_id, min_quantity)\r\n      do update set\r\n        price = excluded.price,\r\n        updated_at = now();\r\n    end if;\r\n  end if;\r\n\r\n  perform public.apply_inventory_delta(\r\n    p_part_id,\r\n    p_branch_id,\r\n    p_quantity,\r\n    v_reason,\r\n    'ingreso_restock',\r\n    'inventory_entries',\r\n    v_entry_id,\r\n    jsonb_build_object(\r\n      'source_reference', p_source_reference,\r\n      'supplier_name', p_supplier_name,\r\n      'currency', v_currency,\r\n      'exchange_rate', case when v_currency = 'USD' then p_exchange_rate else null end,\r\n      'unit_cost', p_unit_cost,\r\n      'unit_price', p_unit_price\r\n    )\r\n  );\r\n\r\n  return v_entry_id;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "create_inventory_exit",
    "parameters": "p_branch_id uuid, p_part_id uuid, p_quantity numeric, p_reason text, p_source_reference text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.create_inventory_exit(p_branch_id uuid, p_part_id uuid, p_quantity numeric, p_reason text, p_source_reference text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_exit_id uuid;\r\n  v_reason text;\r\nbegin\r\n  if not public.inventory_has_management_access() then\r\n    raise exception 'Only admin or manager can create inventory exits';\r\n  end if;\r\n\r\n  if not public.inventory_can_manage_branch(p_branch_id) then\r\n    raise exception 'No permission for selected branch';\r\n  end if;\r\n\r\n  if p_quantity is null or p_quantity <= 0 then\r\n    raise exception 'Quantity must be greater than zero';\r\n  end if;\r\n\r\n  v_reason := coalesce(nullif(trim(p_reason), ''), 'Salida de inventario');\r\n\r\n  insert into public.inventory_exits (\r\n    branch_id,\r\n    part_id,\r\n    quantity,\r\n    reason,\r\n    source_reference,\r\n    created_by\r\n  )\r\n  values (\r\n    p_branch_id,\r\n    p_part_id,\r\n    p_quantity,\r\n    v_reason,\r\n    nullif(trim(coalesce(p_source_reference, '')), ''),\r\n    auth.uid()\r\n  )\r\n  returning id into v_exit_id;\r\n\r\n  perform public.apply_inventory_delta(\r\n    p_part_id,\r\n    p_branch_id,\r\n    -p_quantity,\r\n    v_reason,\r\n    'salida_ajuste',\r\n    'inventory_exits',\r\n    v_exit_id,\r\n    jsonb_build_object('source_reference', p_source_reference)\r\n  );\r\n\r\n  return v_exit_id;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "create_inventory_transfer_request",
    "parameters": "p_from_branch_id uuid, p_to_branch_id uuid, p_items jsonb, p_notes text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.create_inventory_transfer_request(p_from_branch_id uuid, p_to_branch_id uuid, p_items jsonb, p_notes text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_transfer_id uuid;\r\n  v_item jsonb;\r\n  v_part_id uuid;\r\n  v_qty numeric(12, 3);\r\n  v_item_count integer := 0;\r\n  v_inventory public.inventory%rowtype;\r\n  v_reserved numeric(12, 3);\r\n  v_available numeric(12, 3);\r\n  v_part_label text;\r\n  v_branch_label text;\r\n  v_available_units bigint;\r\n  v_requested_units bigint;\r\nbegin\r\n  if not public.inventory_has_management_access() then\r\n    raise exception 'Only admin or manager can create transfers';\r\n  end if;\r\n\r\n  if p_from_branch_id is null or p_to_branch_id is null then\r\n    raise exception 'Origin and destination branches are required';\r\n  end if;\r\n\r\n  if p_from_branch_id = p_to_branch_id then\r\n    raise exception 'Origin and destination branches must be different';\r\n  end if;\r\n\r\n  if not public.inventory_can_manage_branch(p_from_branch_id) then\r\n    raise exception 'No permission for origin branch';\r\n  end if;\r\n\r\n  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then\r\n    raise exception 'At least one item is required';\r\n  end if;\r\n\r\n  select b.name\r\n  into v_branch_label\r\n  from public.branches b\r\n  where b.id = p_from_branch_id;\r\n\r\n  v_branch_label := coalesce(nullif(trim(v_branch_label), ''), 'Sucursal de origen');\r\n\r\n  insert into public.inventory_transfer_requests (\r\n    from_branch_id,\r\n    to_branch_id,\r\n    status,\r\n    notes,\r\n    requested_by,\r\n    requested_at\r\n  )\r\n  values (\r\n    p_from_branch_id,\r\n    p_to_branch_id,\r\n    'pending',\r\n    nullif(trim(coalesce(p_notes, '')), ''),\r\n    auth.uid(),\r\n    now()\r\n  )\r\n  returning id into v_transfer_id;\r\n\r\n  for v_item in\r\n    select *\r\n    from jsonb_array_elements(p_items)\r\n  loop\r\n    v_part_id := nullif(v_item->>'part_id', '')::uuid;\r\n    v_qty := coalesce((v_item->>'quantity')::numeric, 0);\r\n\r\n    if v_part_id is null or v_qty <= 0 then\r\n      raise exception 'Invalid transfer item payload';\r\n    end if;\r\n\r\n    select coalesce(nullif(trim(p.name), ''), nullif(trim(p.code), ''), 'Producto')\r\n    into v_part_label\r\n    from public.parts p\r\n    where p.id = v_part_id\r\n      and p.branch_id = p_from_branch_id;\r\n\r\n    if not found then\r\n      raise exception 'El producto seleccionado no pertenece a la sucursal de origen.';\r\n    end if;\r\n\r\n    select *\r\n    into v_inventory\r\n    from public.inventory i\r\n    where i.part_id = v_part_id\r\n      and i.branch_id = p_from_branch_id\r\n    for update;\r\n\r\n    if not found then\r\n      raise exception 'No existe inventario en origen para el producto \"%\" en la sucursal \"%\".', v_part_label, v_branch_label;\r\n    end if;\r\n\r\n    v_reserved := coalesce(\r\n      public.get_reserved_inventory_quantity(v_part_id, p_from_branch_id, null),\r\n      0\r\n    );\r\n    v_available := coalesce(v_inventory.quantity, 0) - v_reserved;\r\n\r\n    if v_available < v_qty then\r\n      v_available_units := round(v_available, 0)::bigint;\r\n      v_requested_units := round(v_qty, 0)::bigint;\r\n\r\n      raise exception\r\n        'Stock insuficiente para reservar \"%\" en sucursal \"%\". Disponible %, solicitado %',\r\n        v_part_label,\r\n        v_branch_label,\r\n        v_available_units,\r\n        v_requested_units;\r\n    end if;\r\n\r\n    insert into public.inventory_transfer_request_items (\r\n      transfer_id,\r\n      part_id,\r\n      quantity,\r\n      reserved_quantity\r\n    )\r\n    values (\r\n      v_transfer_id,\r\n      v_part_id,\r\n      v_qty,\r\n      v_qty\r\n    )\r\n    on conflict (transfer_id, part_id)\r\n    do update set\r\n      quantity = public.inventory_transfer_request_items.quantity + excluded.quantity,\r\n      reserved_quantity = public.inventory_transfer_request_items.reserved_quantity + excluded.reserved_quantity,\r\n      updated_at = now();\r\n\r\n    v_item_count := v_item_count + 1;\r\n  end loop;\r\n\r\n  if v_item_count = 0 then\r\n    raise exception 'At least one valid transfer item is required';\r\n  end if;\r\n\r\n  insert into public.inventory_transfer_action_history (\r\n    transfer_id,\r\n    action_type,\r\n    reason,\r\n    performed_by,\r\n    details\r\n  )\r\n  values (\r\n    v_transfer_id,\r\n    'creado',\r\n    coalesce(nullif(trim(p_notes), ''), 'Traspaso pendiente creado'),\r\n    auth.uid(),\r\n    jsonb_build_object('items', v_item_count, 'reserved', true)\r\n  );\r\n\r\n  return v_transfer_id;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "create_user_profile",
    "parameters": "p_id uuid, p_full_name text, p_email text, p_branch_id uuid, p_role_id uuid, p_phone text",
    "return_type": "users",
    "full_definition": "CREATE OR REPLACE FUNCTION public.create_user_profile(p_id uuid, p_full_name text, p_email text, p_branch_id uuid, p_role_id uuid, p_phone text DEFAULT NULL::text)\n RETURNS users\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_user public.users;\r\nBEGIN\r\n  PERFORM public.ensure_admin();\r\n\r\n  IF p_id IS NULL THEN\r\n    RAISE EXCEPTION 'El id de usuario es obligatorio.';\r\n  END IF;\r\n\r\n  IF NULLIF(trim(p_full_name), '') IS NULL THEN\r\n    RAISE EXCEPTION 'El nombre es obligatorio.';\r\n  END IF;\r\n\r\n  IF NULLIF(trim(p_email), '') IS NULL THEN\r\n    RAISE EXCEPTION 'El correo es obligatorio.';\r\n  END IF;\r\n\r\n  IF NOT EXISTS (SELECT 1 FROM public.roles r WHERE r.id = p_role_id) THEN\r\n    RAISE EXCEPTION 'Rol no encontrado.';\r\n  END IF;\r\n\r\n  IF NOT EXISTS (SELECT 1 FROM public.branches b WHERE b.id = p_branch_id) THEN\r\n    RAISE EXCEPTION 'Sucursal no encontrada.';\r\n  END IF;\r\n\r\n  INSERT INTO public.users (id, full_name, phone, email, branch_id, role_id)\r\n  VALUES (\r\n    p_id,\r\n    trim(p_full_name),\r\n    NULLIF(trim(COALESCE(p_phone, '')), ''),\r\n    lower(trim(p_email)),\r\n    p_branch_id,\r\n    p_role_id\r\n  )\r\n  RETURNING * INTO v_user;\r\n\r\n  INSERT INTO public.user_roles (user_id, role_id, assigned_by)\r\n  VALUES (p_id, p_role_id, public.current_request_user_id());\r\n\r\n  RETURN v_user;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "current_request_user_id",
    "parameters": "",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.current_request_user_id()\n RETURNS uuid\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_user uuid;\r\n  v_claims jsonb;\r\nBEGIN\r\n  v_user := auth.uid();\r\n  IF v_user IS NOT NULL THEN\r\n    RETURN v_user;\r\n  END IF;\r\n\r\n  BEGIN\r\n    v_user := NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;\r\n  EXCEPTION\r\n    WHEN OTHERS THEN\r\n      v_user := NULL;\r\n  END;\r\n\r\n  IF v_user IS NOT NULL THEN\r\n    RETURN v_user;\r\n  END IF;\r\n\r\n  BEGIN\r\n    v_claims := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb;\r\n    v_user := NULLIF(v_claims ->> 'sub', '')::uuid;\r\n  EXCEPTION\r\n    WHEN OTHERS THEN\r\n      v_user := NULL;\r\n  END;\r\n\r\n  RETURN v_user;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "current_user_branch_id",
    "parameters": "",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.current_user_branch_id()\n RETURNS uuid\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select u.branch_id\r\n  from public.users u\r\n  where u.id = auth.uid()\r\n  limit 1\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "current_user_role_name",
    "parameters": "",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION public.current_user_role_name()\n RETURNS text\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select r.name\r\n  from public.users u\r\n  join public.roles r on r.id = u.role_id\r\n  where u.id = auth.uid()\r\n  limit 1\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "delete_branch",
    "parameters": "p_id uuid",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.delete_branch(p_id uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_deleted int;\r\nBEGIN\r\n  PERFORM public.ensure_admin();\r\n\r\n  IF p_id IS NULL THEN\r\n    RAISE EXCEPTION 'El id de sucursal es obligatorio.';\r\n  END IF;\r\n\r\n  DELETE FROM public.branches\r\n  WHERE id = p_id;\r\n\r\n  GET DIAGNOSTICS v_deleted = ROW_COUNT;\r\n\r\n  IF v_deleted = 0 THEN\r\n    RAISE EXCEPTION 'Sucursal no encontrada.';\r\n  END IF;\r\n\r\n  RETURN true;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "delete_user",
    "parameters": "p_id uuid",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.delete_user(p_id uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_deleted int;\r\nBEGIN\r\n  PERFORM public.ensure_admin();\r\n\r\n  IF p_id IS NULL THEN\r\n    RAISE EXCEPTION 'El id de usuario es obligatorio.';\r\n  END IF;\r\n\r\n  DELETE FROM public.users\r\n  WHERE id = p_id;\r\n\r\n  GET DIAGNOSTICS v_deleted = ROW_COUNT;\r\n\r\n  IF v_deleted = 0 THEN\r\n    RAISE EXCEPTION 'Usuario no encontrado.';\r\n  END IF;\r\n\r\n  RETURN true;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "ensure_admin",
    "parameters": "",
    "return_type": "void",
    "full_definition": "CREATE OR REPLACE FUNCTION public.ensure_admin()\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_user uuid;\r\nBEGIN\r\n  v_user := public.current_request_user_id();\r\n\r\n  IF v_user IS NULL THEN\r\n    RAISE EXCEPTION 'No hay sesión autenticada de Supabase activa.';\r\n  END IF;\r\n\r\n  IF NOT public.is_admin(v_user) THEN\r\n    RAISE EXCEPTION 'Solo administradores pueden ejecutar esta operación.';\r\n  END IF;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "ensure_transfer_destination_part",
    "parameters": "p_from_part_id uuid, p_from_branch_id uuid, p_to_branch_id uuid",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.ensure_transfer_destination_part(p_from_part_id uuid, p_from_branch_id uuid, p_to_branch_id uuid)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_source public.parts%rowtype;\r\n  v_destination_part_id uuid;\r\n  v_source_min_quantity numeric(12,3);\r\nbegin\r\n  select *\r\n  into v_source\r\n  from public.parts p\r\n  where p.id = p_from_part_id\r\n    and p.branch_id = p_from_branch_id;\r\n\r\n  if not found then\r\n    raise exception 'Source product % does not belong to branch %', p_from_part_id, p_from_branch_id;\r\n  end if;\r\n\r\n  select p.id\r\n  into v_destination_part_id\r\n  from public.parts p\r\n  where p.branch_id = p_to_branch_id\r\n    and lower(trim(p.code)) = lower(trim(v_source.code))\r\n  limit 1;\r\n\r\n  if v_destination_part_id is null then\r\n    insert into public.parts (\r\n      code,\r\n      name,\r\n      description,\r\n      category,\r\n      category_id,\r\n      image_url,\r\n      cost,\r\n      price,\r\n      kit_price,\r\n      quotation_min_price,\r\n      quotation_max_price,\r\n      tracking_mode,\r\n      requires_serialization,\r\n      branch_id,\r\n      is_active,\r\n      created_by,\r\n      updated_by\r\n    )\r\n    values (\r\n      v_source.code,\r\n      v_source.name,\r\n      v_source.description,\r\n      v_source.category,\r\n      null,\r\n      v_source.image_url,\r\n      v_source.cost,\r\n      v_source.price,\r\n      v_source.kit_price,\r\n      v_source.quotation_min_price,\r\n      v_source.quotation_max_price,\r\n      v_source.tracking_mode,\r\n      v_source.requires_serialization,\r\n      p_to_branch_id,\r\n      true,\r\n      auth.uid(),\r\n      auth.uid()\r\n    )\r\n    on conflict (branch_id, code)\r\n    do update set\r\n      updated_at = now(),\r\n      updated_by = auth.uid()\r\n    returning id into v_destination_part_id;\r\n\r\n    insert into public.product_price_tiers (part_id, min_quantity, price)\r\n    select\r\n      v_destination_part_id,\r\n      t.min_quantity,\r\n      t.price\r\n    from public.product_price_tiers t\r\n    where t.part_id = v_source.id\r\n    on conflict (part_id, min_quantity)\r\n    do update set\r\n      price = excluded.price,\r\n      updated_at = now();\r\n\r\n    if not exists (\r\n      select 1\r\n      from public.product_price_tiers t\r\n      where t.part_id = v_destination_part_id\r\n        and t.min_quantity = 1\r\n    ) then\r\n      insert into public.product_price_tiers (part_id, min_quantity, price)\r\n      values (v_destination_part_id, 1, coalesce(v_source.price, 0))\r\n      on conflict (part_id, min_quantity) do nothing;\r\n    end if;\r\n  end if;\r\n\r\n  select i.min_quantity\r\n  into v_source_min_quantity\r\n  from public.inventory i\r\n  where i.part_id = v_source.id\r\n    and i.branch_id = p_from_branch_id;\r\n\r\n  insert into public.inventory (\r\n    part_id,\r\n    branch_id,\r\n    quantity,\r\n    min_quantity,\r\n    last_restock\r\n  )\r\n  values (\r\n    v_destination_part_id,\r\n    p_to_branch_id,\r\n    0,\r\n    coalesce(v_source_min_quantity, 0),\r\n    null\r\n  )\r\n  on conflict (part_id, branch_id)\r\n  do update set\r\n    min_quantity = least(public.inventory.min_quantity, excluded.min_quantity),\r\n    updated_at = now();\r\n\r\n  return v_destination_part_id;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "generate_inventory_product_code",
    "parameters": "p_branch_id uuid, p_category_name text, p_category_id uuid",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION public.generate_inventory_product_code(p_branch_id uuid, p_category_name text, p_category_id uuid DEFAULT NULL::uuid)\n RETURNS text\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_prefix text;\r\n  v_next integer;\r\n  v_existing_max integer;\r\nbegin\r\n  if not public.inventory_is_admin() then\r\n    raise exception 'Only admin can generate product codes';\r\n  end if;\r\n\r\n  v_prefix := public.inventory_resolve_product_code_prefix(\r\n    p_branch_id,\r\n    p_category_name,\r\n    p_category_id\r\n  );\r\n\r\n  insert into public.inventory_product_code_counters (branch_id, prefix, next_number)\r\n  values (p_branch_id, v_prefix, 1)\r\n  on conflict (branch_id, prefix) do nothing;\r\n\r\n  select c.next_number\r\n  into v_next\r\n  from public.inventory_product_code_counters c\r\n  where c.branch_id = p_branch_id\r\n    and c.prefix = v_prefix\r\n  for update;\r\n\r\n  select coalesce(\r\n    max((regexp_match(p.code, '^' || v_prefix || '-([0-9]+)$'))[1]::integer),\r\n    0\r\n  )\r\n  into v_existing_max\r\n  from public.parts p\r\n  where p.branch_id = p_branch_id\r\n    and p.code ~ ('^' || v_prefix || '-[0-9]+$');\r\n\r\n  v_next := greatest(coalesce(v_next, 1), coalesce(v_existing_max, 0) + 1);\r\n\r\n  update public.inventory_product_code_counters\r\n  set\r\n    next_number = v_next + 1,\r\n    updated_at = now()\r\n  where branch_id = p_branch_id\r\n    and prefix = v_prefix;\r\n\r\n  return v_prefix || '-' || v_next::text;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_branch_by_id",
    "parameters": "p_id uuid",
    "return_type": "branches",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_branch_by_id(p_id uuid)\n RETURNS branches\n LANGUAGE sql\n STABLE\n SET search_path TO 'public'\nAS $function$\r\n  SELECT b.*\r\n  FROM public.branches b\r\n  WHERE b.id = p_id;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_branches",
    "parameters": "",
    "return_type": "SETOF branches",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_branches()\n RETURNS SETOF branches\n LANGUAGE sql\n STABLE\n SET search_path TO 'public'\nAS $function$\r\n  SELECT b.*\r\n  FROM public.branches b\r\n  ORDER BY b.created_at DESC;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_branches_page",
    "parameters": "p_search text, p_limit integer, p_offset integer",
    "return_type": "TABLE(id uuid, name text, address text, phone text, created_at timestamp with time zone, updated_at timestamp with time zone)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_branches_page(p_search text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)\n RETURNS TABLE(id uuid, name text, address text, phone text, created_at timestamp with time zone, updated_at timestamp with time zone)\n LANGUAGE sql\n STABLE\n SET search_path TO 'public'\nAS $function$\r\n  SELECT\r\n    b.id,\r\n    b.name,\r\n    b.address,\r\n    b.phone,\r\n    b.created_at,\r\n    b.updated_at\r\n  FROM public.branches b\r\n  WHERE\r\n    p_search IS NULL\r\n    OR trim(p_search) = ''\r\n    OR b.name ILIKE '%' || trim(p_search) || '%'\r\n    OR COALESCE(b.address, '') ILIKE '%' || trim(p_search) || '%'\r\n  ORDER BY b.created_at DESC\r\n  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200))\r\n  OFFSET GREATEST(COALESCE(p_offset, 0), 0);\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_cash_movement_edit_requests",
    "parameters": "p_status text, p_cash_session_id uuid",
    "return_type": "TABLE(request_id uuid, movement_id uuid, cash_session_id uuid, branch_id uuid, movement_type text, current_amount numeric, current_description text, proposed_amount numeric, proposed_description text, request_reason text, status text, requested_by uuid, requested_by_name text, requested_role text, reviewed_by uuid, reviewed_by_name text, review_notes text, applied boolean, created_at timestamp with time zone, reviewed_at timestamp with time zone)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_cash_movement_edit_requests(p_status text DEFAULT NULL::text, p_cash_session_id uuid DEFAULT NULL::uuid)\n RETURNS TABLE(request_id uuid, movement_id uuid, cash_session_id uuid, branch_id uuid, movement_type text, current_amount numeric, current_description text, proposed_amount numeric, proposed_description text, request_reason text, status text, requested_by uuid, requested_by_name text, requested_role text, reviewed_by uuid, reviewed_by_name text, review_notes text, applied boolean, created_at timestamp with time zone, reviewed_at timestamp with time zone)\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select\r\n    r.id as request_id,\r\n    r.movement_id,\r\n    r.cash_session_id,\r\n    r.branch_id,\r\n    m.movement_type,\r\n    m.amount as current_amount,\r\n    m.description as current_description,\r\n    r.proposed_amount,\r\n    r.proposed_description,\r\n    r.request_reason,\r\n    r.status,\r\n    r.requested_by,\r\n    u_req.full_name as requested_by_name,\r\n    r.requested_role,\r\n    r.reviewed_by,\r\n    u_rev.full_name as reviewed_by_name,\r\n    r.review_notes,\r\n    r.applied,\r\n    r.created_at,\r\n    r.reviewed_at\r\n  from public.cash_movement_edit_requests r\r\n  join public.cash_movements m on m.id = r.movement_id\r\n  left join public.users u_req on u_req.id = r.requested_by\r\n  left join public.users u_rev on u_rev.id = r.reviewed_by\r\n  where (p_status is null or trim(p_status) = '' or r.status = lower(trim(p_status)))\r\n    and (p_cash_session_id is null or r.cash_session_id = p_cash_session_id)\r\n    and (\r\n      public.cash_is_admin()\r\n      or (\r\n        public.cash_is_manager()\r\n        and r.branch_id = public.current_user_branch_id()\r\n      )\r\n    )\r\n  order by r.created_at desc, r.id desc;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_cash_session_movements",
    "parameters": "p_cash_session_id uuid",
    "return_type": "TABLE(movement_id uuid, movement_type text, amount numeric, description text, payment_method text, reference_table text, reference_id uuid, created_by uuid, created_by_name text, updated_by uuid, updated_by_name text, created_at timestamp with time zone, updated_at timestamp with time zone, metadata jsonb)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_cash_session_movements(p_cash_session_id uuid)\n RETURNS TABLE(movement_id uuid, movement_type text, amount numeric, description text, payment_method text, reference_table text, reference_id uuid, created_by uuid, created_by_name text, updated_by uuid, updated_by_name text, created_at timestamp with time zone, updated_at timestamp with time zone, metadata jsonb)\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select\r\n    m.id as movement_id,\r\n    m.movement_type,\r\n    m.amount,\r\n    m.description,\r\n    m.payment_method,\r\n    m.reference_table,\r\n    m.reference_id,\r\n    m.created_by,\r\n    u_created.full_name as created_by_name,\r\n    m.updated_by,\r\n    u_updated.full_name as updated_by_name,\r\n    m.created_at,\r\n    m.updated_at,\r\n    m.metadata\r\n  from public.cash_movements m\r\n  join public.cash_sessions s on s.id = m.cash_session_id\r\n  left join public.users u_created on u_created.id = m.created_by\r\n  left join public.users u_updated on u_updated.id = m.updated_by\r\n  where m.cash_session_id = p_cash_session_id\r\n    and public.cash_can_access_branch(s.branch_id)\r\n  order by m.created_at desc, m.id desc;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_cash_session_snapshots",
    "parameters": "p_cash_session_id uuid",
    "return_type": "TABLE(snapshot_id uuid, snapshot_type text, item_count integer, total_units numeric, taken_by uuid, taken_by_name text, taken_at timestamp with time zone)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_cash_session_snapshots(p_cash_session_id uuid)\n RETURNS TABLE(snapshot_id uuid, snapshot_type text, item_count integer, total_units numeric, taken_by uuid, taken_by_name text, taken_at timestamp with time zone)\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select\r\n    s.id as snapshot_id,\r\n    s.snapshot_type,\r\n    s.item_count,\r\n    s.total_units,\r\n    s.taken_by,\r\n    u.full_name as taken_by_name,\r\n    s.taken_at\r\n  from public.cash_inventory_snapshots s\r\n  join public.cash_sessions cs on cs.id = s.cash_session_id\r\n  left join public.users u on u.id = s.taken_by\r\n  where s.cash_session_id = p_cash_session_id\r\n    and public.cash_can_access_branch(cs.branch_id)\r\n  order by s.taken_at asc;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_current_cash_session",
    "parameters": "p_branch_id uuid",
    "return_type": "TABLE(cash_session_id uuid, branch_id uuid, branch_name text, opened_by uuid, opened_by_name text, opening_role text, opened_at timestamp with time zone, opening_amount numeric, status text, expected_closing_amount numeric, closing_amount_counted numeric, variance_amount numeric, manual_income_total numeric, manual_expense_total numeric, sales_cash_total numeric, sales_return_total numeric, expected_now numeric, total_movements bigint)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_current_cash_session(p_branch_id uuid DEFAULT NULL::uuid)\n RETURNS TABLE(cash_session_id uuid, branch_id uuid, branch_name text, opened_by uuid, opened_by_name text, opening_role text, opened_at timestamp with time zone, opening_amount numeric, status text, expected_closing_amount numeric, closing_amount_counted numeric, variance_amount numeric, manual_income_total numeric, manual_expense_total numeric, sales_cash_total numeric, sales_return_total numeric, expected_now numeric, total_movements bigint)\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  with current_session as (\r\n    select s.*\r\n    from public.cash_sessions s\r\n    where s.branch_id = (\r\n      case\r\n        when public.cash_is_admin() then coalesce(p_branch_id, public.current_user_branch_id())\r\n        else public.current_user_branch_id()\r\n      end\r\n    )\r\n      and s.status = 'open'\r\n    order by s.opened_at desc\r\n    limit 1\r\n  ),\r\n  movement_totals as (\r\n    select\r\n      m.cash_session_id,\r\n      coalesce(sum(case when m.movement_type = 'manual_income' then m.amount else 0 end), 0)::numeric(12, 2) as manual_income_total,\r\n      coalesce(sum(case when m.movement_type = 'manual_expense' then m.amount else 0 end), 0)::numeric(12, 2) as manual_expense_total,\r\n      coalesce(sum(case when m.movement_type = 'sale_cash' then m.amount else 0 end), 0)::numeric(12, 2) as sales_cash_total,\r\n      coalesce(sum(case when m.movement_type = 'sale_return_cash' then m.amount else 0 end), 0)::numeric(12, 2) as sales_return_total,\r\n      count(m.id) as total_movements\r\n    from public.cash_movements m\r\n    join current_session cs on cs.id = m.cash_session_id\r\n    group by m.cash_session_id\r\n  )\r\n  select\r\n    cs.id as cash_session_id,\r\n    cs.branch_id,\r\n    b.name as branch_name,\r\n    cs.opened_by,\r\n    u.full_name as opened_by_name,\r\n    cs.opening_role,\r\n    cs.opened_at,\r\n    cs.opening_amount,\r\n    cs.status,\r\n    cs.expected_closing_amount,\r\n    cs.closing_amount_counted,\r\n    cs.variance_amount,\r\n    coalesce(mt.manual_income_total, 0)::numeric(12, 2) as manual_income_total,\r\n    coalesce(mt.manual_expense_total, 0)::numeric(12, 2) as manual_expense_total,\r\n    coalesce(mt.sales_cash_total, 0)::numeric(12, 2) as sales_cash_total,\r\n    coalesce(mt.sales_return_total, 0)::numeric(12, 2) as sales_return_total,\r\n    (\r\n      cs.opening_amount\r\n      + coalesce(mt.sales_cash_total, 0)\r\n      + coalesce(mt.manual_income_total, 0)\r\n      - coalesce(mt.manual_expense_total, 0)\r\n      - coalesce(mt.sales_return_total, 0)\r\n    )::numeric(12, 2) as expected_now,\r\n    coalesce(mt.total_movements, 0) as total_movements\r\n  from current_session cs\r\n  join public.branches b on b.id = cs.branch_id\r\n  left join public.users u on u.id = cs.opened_by\r\n  left join movement_totals mt on mt.cash_session_id = cs.id;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_current_user_profile",
    "parameters": "",
    "return_type": "TABLE(id uuid, full_name text, email text, role_name text, branch_id uuid, branch_name text)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_current_user_profile()\n RETURNS TABLE(id uuid, full_name text, email text, role_name text, branch_id uuid, branch_name text)\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select\r\n    u.id,\r\n    u.full_name,\r\n    u.email,\r\n    (select r.name from public.roles r where r.id = u.role_id) as role_name,\r\n    u.branch_id,\r\n    (select b.name from public.branches b where b.id = u.branch_id) as branch_name\r\n  from public.users u\r\n  where u.id = auth.uid();\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_inventory_entries",
    "parameters": "p_branch_id uuid, p_from timestamp with time zone, p_to timestamp with time zone",
    "return_type": "TABLE(entry_id uuid, branch_id uuid, branch_name text, part_id uuid, part_code text, part_name text, quantity numeric, unit_cost numeric, unit_price numeric, currency text, exchange_rate numeric, source_reference text, supplier_name text, reason text, notes text, created_by uuid, created_by_name text, created_at timestamp with time zone)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_inventory_entries(p_branch_id uuid DEFAULT NULL::uuid, p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone)\n RETURNS TABLE(entry_id uuid, branch_id uuid, branch_name text, part_id uuid, part_code text, part_name text, quantity numeric, unit_cost numeric, unit_price numeric, currency text, exchange_rate numeric, source_reference text, supplier_name text, reason text, notes text, created_by uuid, created_by_name text, created_at timestamp with time zone)\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select\r\n    e.id as entry_id,\r\n    e.branch_id,\r\n    b.name as branch_name,\r\n    e.part_id,\r\n    p.code as part_code,\r\n    p.name as part_name,\r\n    e.quantity,\r\n    e.unit_cost,\r\n    e.unit_price,\r\n    e.currency,\r\n    e.exchange_rate,\r\n    e.source_reference,\r\n    e.supplier_name,\r\n    e.reason,\r\n    e.notes,\r\n    e.created_by,\r\n    u.full_name as created_by_name,\r\n    e.created_at\r\n  from public.inventory_entries e\r\n  join public.branches b on b.id = e.branch_id\r\n  join public.parts p on p.id = e.part_id\r\n  left join public.users u on u.id = e.created_by\r\n  where\r\n    (p_branch_id is null or e.branch_id = p_branch_id)\r\n    and (p_from is null or e.created_at >= p_from)\r\n    and (p_to is null or e.created_at <= p_to)\r\n    and (\r\n      public.inventory_is_admin()\r\n      or (\r\n        public.has_inventory_read_access()\r\n        and e.branch_id = public.current_user_branch_id()\r\n      )\r\n    )\r\n  order by e.created_at desc, e.id desc\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_inventory_movement_history",
    "parameters": "p_branch_id uuid, p_part_id uuid, p_from timestamp with time zone, p_to timestamp with time zone",
    "return_type": "TABLE(movement_id uuid, branch_id uuid, part_id uuid, part_code text, part_name text, movement_type text, quantity numeric, quantity_before numeric, quantity_after numeric, reason text, reference_table text, reference_id uuid, created_by uuid, created_at timestamp with time zone, metadata jsonb)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_inventory_movement_history(p_branch_id uuid DEFAULT NULL::uuid, p_part_id uuid DEFAULT NULL::uuid, p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone)\n RETURNS TABLE(movement_id uuid, branch_id uuid, part_id uuid, part_code text, part_name text, movement_type text, quantity numeric, quantity_before numeric, quantity_after numeric, reason text, reference_table text, reference_id uuid, created_by uuid, created_at timestamp with time zone, metadata jsonb)\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select\r\n    m.id as movement_id,\r\n    m.branch_id,\r\n    m.part_id,\r\n    p.code as part_code,\r\n    p.name as part_name,\r\n    m.movement_type,\r\n    m.quantity,\r\n    m.quantity_before,\r\n    m.quantity_after,\r\n    m.reason,\r\n    m.reference_table,\r\n    m.reference_id,\r\n    m.created_by,\r\n    m.created_at,\r\n    m.metadata\r\n  from public.inventory_movement_history m\r\n  join public.parts p on p.id = m.part_id\r\n  where (p_branch_id is null or m.branch_id = p_branch_id)\r\n    and (p_part_id is null or m.part_id = p_part_id)\r\n    and (p_from is null or m.created_at >= p_from)\r\n    and (p_to is null or m.created_at <= p_to)\r\n  order by m.created_at desc, m.id desc\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_inventory_snapshot_history",
    "parameters": "p_branch_id uuid, p_snapshot_type text, p_from timestamp with time zone, p_to timestamp with time zone, p_product_search text",
    "return_type": "TABLE(snapshot_id uuid, cash_session_id uuid, branch_id uuid, branch_name text, snapshot_type text, item_count integer, total_units numeric, taken_by uuid, taken_by_name text, taken_at timestamp with time zone, opening_role text, opened_by_name text, matching_product_count bigint, matching_product_units numeric)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_inventory_snapshot_history(p_branch_id uuid DEFAULT NULL::uuid, p_snapshot_type text DEFAULT NULL::text, p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone, p_product_search text DEFAULT NULL::text)\n RETURNS TABLE(snapshot_id uuid, cash_session_id uuid, branch_id uuid, branch_name text, snapshot_type text, item_count integer, total_units numeric, taken_by uuid, taken_by_name text, taken_at timestamp with time zone, opening_role text, opened_by_name text, matching_product_count bigint, matching_product_units numeric)\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_role text;\r\n  v_user_branch_id uuid;\r\n  v_target_branch_id uuid;\r\n  v_snapshot_type text;\r\n  v_search text;\r\nBEGIN\r\n  v_role := public.cash_current_role_name();\r\n  v_user_branch_id := public.current_user_branch_id();\r\n  v_snapshot_type := lower(trim(coalesce(p_snapshot_type, '')));\r\n  v_search := nullif(trim(coalesce(p_product_search, '')), '');\r\n\r\n  IF v_role NOT IN ('admin', 'manager', 'employee', 'read_only') THEN\r\n    RAISE EXCEPTION 'Rol no autorizado para consultar snapshots de inventario';\r\n  END IF;\r\n\r\n  IF v_snapshot_type <> '' AND v_snapshot_type NOT IN ('open', 'close') THEN\r\n    RAISE EXCEPTION 'Invalid snapshot type. Use open or close';\r\n  END IF;\r\n\r\n  IF v_role = 'admin' THEN\r\n    v_target_branch_id := p_branch_id;\r\n  ELSE\r\n    IF v_user_branch_id IS NULL THEN\r\n      RAISE EXCEPTION 'No branch assigned for current user';\r\n    END IF;\r\n    v_target_branch_id := v_user_branch_id;\r\n  END IF;\r\n\r\n  RETURN QUERY\r\n  WITH base AS (\r\n    SELECT\r\n      s.id,\r\n      s.cash_session_id,\r\n      s.branch_id,\r\n      b.name AS branch_name,\r\n      s.snapshot_type,\r\n      s.item_count,\r\n      s.total_units,\r\n      s.taken_by,\r\n      u_taken.full_name AS taken_by_name,\r\n      s.taken_at,\r\n      cs.opening_role,\r\n      u_opened.full_name AS opened_by_name\r\n    FROM public.cash_inventory_snapshots s\r\n    JOIN public.cash_sessions cs ON cs.id = s.cash_session_id\r\n    JOIN public.branches b ON b.id = s.branch_id\r\n    LEFT JOIN public.users u_taken ON u_taken.id = s.taken_by\r\n    LEFT JOIN public.users u_opened ON u_opened.id = cs.opened_by\r\n    WHERE\r\n      (v_target_branch_id IS NULL OR s.branch_id = v_target_branch_id)\r\n      AND (v_snapshot_type = '' OR s.snapshot_type = v_snapshot_type)\r\n      AND (p_from IS NULL OR s.taken_at >= p_from)\r\n      AND (p_to IS NULL OR s.taken_at <= p_to)\r\n  ),\r\n  matches AS (\r\n    SELECT\r\n      i.snapshot_id,\r\n      count(*) AS matching_product_count,\r\n      coalesce(sum(i.quantity), 0)::numeric(12, 3) AS matching_product_units\r\n    FROM public.cash_inventory_snapshot_items i\r\n    WHERE\r\n      v_search IS NOT NULL\r\n      AND (\r\n        i.part_name ILIKE '%' || v_search || '%'\r\n        OR i.part_code ILIKE '%' || v_search || '%'\r\n      )\r\n    GROUP BY i.snapshot_id\r\n  )\r\n  SELECT\r\n    b.id AS snapshot_id,\r\n    b.cash_session_id,\r\n    b.branch_id,\r\n    b.branch_name,\r\n    b.snapshot_type,\r\n    b.item_count,\r\n    b.total_units,\r\n    b.taken_by,\r\n    b.taken_by_name,\r\n    b.taken_at,\r\n    b.opening_role,\r\n    b.opened_by_name,\r\n    coalesce(m.matching_product_count, 0) AS matching_product_count,\r\n    coalesce(m.matching_product_units, 0)::numeric(12, 3) AS matching_product_units\r\n  FROM base b\r\n  LEFT JOIN matches m ON m.snapshot_id = b.id\r\n  WHERE (v_search IS NULL OR m.snapshot_id IS NOT NULL)\r\n  ORDER BY b.taken_at DESC, b.id DESC;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_inventory_snapshot_items",
    "parameters": "p_snapshot_id uuid, p_product_search text",
    "return_type": "TABLE(snapshot_id uuid, part_id uuid, part_code text, part_name text, quantity numeric)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_inventory_snapshot_items(p_snapshot_id uuid, p_product_search text DEFAULT NULL::text)\n RETURNS TABLE(snapshot_id uuid, part_id uuid, part_code text, part_name text, quantity numeric)\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_role text;\r\n  v_user_branch_id uuid;\r\n  v_snapshot_branch_id uuid;\r\n  v_search text;\r\nBEGIN\r\n  IF p_snapshot_id IS NULL THEN\r\n    RAISE EXCEPTION 'Snapshot id is required';\r\n  END IF;\r\n\r\n  v_role := public.cash_current_role_name();\r\n  v_user_branch_id := public.current_user_branch_id();\r\n  v_search := nullif(trim(coalesce(p_product_search, '')), '');\r\n\r\n  IF v_role NOT IN ('admin', 'manager', 'employee', 'read_only') THEN\r\n    RAISE EXCEPTION 'Rol no autorizado para consultar detalle de snapshots';\r\n  END IF;\r\n\r\n  SELECT s.branch_id\r\n  INTO v_snapshot_branch_id\r\n  FROM public.cash_inventory_snapshots s\r\n  WHERE s.id = p_snapshot_id;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Snapshot not found';\r\n  END IF;\r\n\r\n  IF v_role <> 'admin' AND (v_user_branch_id IS NULL OR v_user_branch_id <> v_snapshot_branch_id) THEN\r\n    RAISE EXCEPTION 'No permission for selected branch snapshot';\r\n  END IF;\r\n\r\n  RETURN QUERY\r\n  SELECT\r\n    i.snapshot_id,\r\n    i.part_id,\r\n    i.part_code,\r\n    i.part_name,\r\n    i.quantity\r\n  FROM public.cash_inventory_snapshot_items i\r\n  WHERE i.snapshot_id = p_snapshot_id\r\n    AND (\r\n      v_search IS NULL\r\n      OR i.part_name ILIKE '%' || v_search || '%'\r\n      OR i.part_code ILIKE '%' || v_search || '%'\r\n    )\r\n  ORDER BY i.part_name ASC, i.part_code ASC;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_inventory_transfer_history",
    "parameters": "p_branch_id uuid, p_from timestamp with time zone, p_to timestamp with time zone",
    "return_type": "TABLE(transfer_id uuid, action_id uuid, action_type text, action_reason text, action_date timestamp with time zone, from_branch_id uuid, to_branch_id uuid, status text, part_id uuid, part_code text, part_name text, quantity numeric, performed_by uuid)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_inventory_transfer_history(p_branch_id uuid DEFAULT NULL::uuid, p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone)\n RETURNS TABLE(transfer_id uuid, action_id uuid, action_type text, action_reason text, action_date timestamp with time zone, from_branch_id uuid, to_branch_id uuid, status text, part_id uuid, part_code text, part_name text, quantity numeric, performed_by uuid)\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select\r\n    r.id as transfer_id,\r\n    h.id as action_id,\r\n    h.action_type,\r\n    h.reason as action_reason,\r\n    h.created_at as action_date,\r\n    r.from_branch_id,\r\n    r.to_branch_id,\r\n    r.status,\r\n    i.part_id,\r\n    p.code as part_code,\r\n    p.name as part_name,\r\n    i.quantity,\r\n    h.performed_by\r\n  from public.inventory_transfer_requests r\r\n  join public.inventory_transfer_action_history h on h.transfer_id = r.id\r\n  join public.inventory_transfer_request_items i on i.transfer_id = r.id\r\n  join public.parts p on p.id = i.part_id\r\n  where (\r\n      p_branch_id is null\r\n      or r.from_branch_id = p_branch_id\r\n      or r.to_branch_id = p_branch_id\r\n    )\r\n    and (p_from is null or h.created_at >= p_from)\r\n    and (p_to is null or h.created_at <= p_to)\r\n  order by h.created_at desc, r.id desc\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_pending_inventory_transfers",
    "parameters": "p_branch_id uuid",
    "return_type": "TABLE(transfer_id uuid, from_branch_id uuid, to_branch_id uuid, status text, notes text, requested_at timestamp with time zone, requested_by uuid, total_items integer, total_quantity numeric, can_complete boolean)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_pending_inventory_transfers(p_branch_id uuid DEFAULT NULL::uuid)\n RETURNS TABLE(transfer_id uuid, from_branch_id uuid, to_branch_id uuid, status text, notes text, requested_at timestamp with time zone, requested_by uuid, total_items integer, total_quantity numeric, can_complete boolean)\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select\r\n    r.id as transfer_id,\r\n    r.from_branch_id,\r\n    r.to_branch_id,\r\n    r.status,\r\n    r.notes,\r\n    r.requested_at,\r\n    r.requested_by,\r\n    count(i.id)::int as total_items,\r\n    coalesce(sum(i.quantity), 0)::numeric as total_quantity,\r\n    (public.inventory_is_admin() or r.to_branch_id = public.current_user_branch_id()) as can_complete\r\n  from public.inventory_transfer_requests r\r\n  left join public.inventory_transfer_request_items i on i.transfer_id = r.id\r\n  where r.status = 'pending'\r\n    and (\r\n      p_branch_id is null\r\n      or r.from_branch_id = p_branch_id\r\n      or r.to_branch_id = p_branch_id\r\n    )\r\n  group by r.id\r\n  order by r.requested_at desc\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_reserved_inventory_quantity",
    "parameters": "p_part_id uuid, p_branch_id uuid, p_exclude_transfer_id uuid",
    "return_type": "numeric",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_reserved_inventory_quantity(p_part_id uuid, p_branch_id uuid, p_exclude_transfer_id uuid DEFAULT NULL::uuid)\n RETURNS numeric\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select coalesce(sum(i.reserved_quantity), 0)::numeric\r\n  from public.inventory_transfer_request_items i\r\n  join public.inventory_transfer_requests r\r\n    on r.id = i.transfer_id\r\n  where r.status = 'pending'\r\n    and r.from_branch_id = p_branch_id\r\n    and i.part_id = p_part_id\r\n    and i.reserved_quantity > 0\r\n    and (p_exclude_transfer_id is null or i.transfer_id <> p_exclude_transfer_id)\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_return_window_days",
    "parameters": "p_branch_id uuid",
    "return_type": "integer",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_return_window_days(p_branch_id uuid)\n RETURNS integer\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select coalesce(\r\n    (\r\n      select s.return_window_days\r\n      from public.inventory_return_settings s\r\n      where s.branch_id = p_branch_id\r\n      limit 1\r\n    ),\r\n    7\r\n  )\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_user_by_id",
    "parameters": "p_id uuid",
    "return_type": "users",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_user_by_id(p_id uuid)\n RETURNS users\n LANGUAGE sql\n STABLE\n SET search_path TO 'public'\nAS $function$\r\n  SELECT u.*\r\n  FROM public.users u\r\n  WHERE u.id = p_id;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "get_users",
    "parameters": "",
    "return_type": "SETOF users",
    "full_definition": "CREATE OR REPLACE FUNCTION public.get_users()\n RETURNS SETOF users\n LANGUAGE sql\n STABLE\n SET search_path TO 'public'\nAS $function$\r\n  SELECT u.*\r\n  FROM public.users u\r\n  ORDER BY u.created_at DESC;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gin_extract_query_trgm",
    "parameters": "text, internal, smallint, internal, internal, internal, internal",
    "return_type": "internal",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gin_extract_query_trgm$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gin_extract_value_trgm",
    "parameters": "text, internal",
    "return_type": "internal",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gin_extract_value_trgm(text, internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gin_extract_value_trgm$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gin_trgm_consistent",
    "parameters": "internal, smallint, text, integer, internal, internal, internal, internal",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal)\n RETURNS boolean\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gin_trgm_consistent$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gin_trgm_triconsistent",
    "parameters": "internal, smallint, text, integer, internal, internal, internal",
    "return_type": "\"char\"",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal)\n RETURNS \"char\"\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gin_trgm_triconsistent$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gtrgm_compress",
    "parameters": "internal",
    "return_type": "internal",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_compress(internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_compress$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gtrgm_consistent",
    "parameters": "internal, text, smallint, oid, internal",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal)\n RETURNS boolean\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_consistent$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gtrgm_decompress",
    "parameters": "internal",
    "return_type": "internal",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_decompress(internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_decompress$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gtrgm_distance",
    "parameters": "internal, text, smallint, oid, internal",
    "return_type": "double precision",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal)\n RETURNS double precision\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_distance$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gtrgm_in",
    "parameters": "cstring",
    "return_type": "gtrgm",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_in(cstring)\n RETURNS gtrgm\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_in$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gtrgm_options",
    "parameters": "internal",
    "return_type": "void",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_options(internal)\n RETURNS void\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE\nAS '$libdir/pg_trgm', $function$gtrgm_options$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gtrgm_out",
    "parameters": "gtrgm",
    "return_type": "cstring",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_out(gtrgm)\n RETURNS cstring\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_out$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gtrgm_penalty",
    "parameters": "internal, internal, internal",
    "return_type": "internal",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_penalty(internal, internal, internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_penalty$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gtrgm_picksplit",
    "parameters": "internal, internal",
    "return_type": "internal",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_picksplit(internal, internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_picksplit$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gtrgm_same",
    "parameters": "gtrgm, gtrgm, internal",
    "return_type": "internal",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_same$function$\n"
  },
  {
    "schema": "public",
    "function_name": "gtrgm_union",
    "parameters": "internal, internal",
    "return_type": "gtrgm",
    "full_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_union(internal, internal)\n RETURNS gtrgm\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_union$function$\n"
  },
  {
    "schema": "public",
    "function_name": "has_inventory_read_access",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.has_inventory_read_access()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select coalesce(public.current_user_role_name() in ('admin', 'manager', 'employee', 'read_only'), false)\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "inventory_can_manage_branch",
    "parameters": "p_branch_id uuid",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.inventory_can_manage_branch(p_branch_id uuid)\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select coalesce(\r\n    public.inventory_is_admin()\r\n    or public.current_user_branch_id() = p_branch_id,\r\n    false\r\n  )\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "inventory_has_management_access",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.inventory_has_management_access()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select coalesce(public.current_user_role_name() in ('admin', 'manager'), false)\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "inventory_is_admin",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.inventory_is_admin()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select coalesce(public.current_user_role_name() = 'admin', false)\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "inventory_normalize_category_token",
    "parameters": "p_category_name text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION public.inventory_normalize_category_token(p_category_name text)\n RETURNS text\n LANGUAGE sql\n IMMUTABLE\nAS $function$\r\n  select coalesce(\r\n    nullif(\r\n      upper(regexp_replace(coalesce(p_category_name, ''), '[^A-Za-z0-9]+', '', 'g')),\r\n      ''\r\n    ),\r\n    'PROD'\r\n  )\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "inventory_resolve_product_code_prefix",
    "parameters": "p_branch_id uuid, p_category_name text, p_category_id uuid",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION public.inventory_resolve_product_code_prefix(p_branch_id uuid, p_category_name text, p_category_id uuid DEFAULT NULL::uuid)\n RETURNS text\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_key text;\r\n  v_token text;\r\n  v_prefix text;\r\n  v_candidate text;\r\n  v_max_len integer;\r\n  v_suffix integer := 1;\r\n  v_len integer;\r\nbegin\r\n  if not public.inventory_is_admin() then\r\n    raise exception 'Only admin can generate product codes';\r\n  end if;\r\n\r\n  if p_branch_id is null then\r\n    raise exception 'Branch is required';\r\n  end if;\r\n\r\n  if nullif(trim(coalesce(p_category_name, '')), '') is null then\r\n    raise exception 'Category is required for automatic code generation';\r\n  end if;\r\n\r\n  v_key := coalesce('id:' || p_category_id::text, 'name:' || lower(trim(p_category_name)));\r\n\r\n  select p.prefix\r\n  into v_prefix\r\n  from public.inventory_product_code_prefixes p\r\n  where p.branch_id = p_branch_id\r\n    and p.category_key = v_key\r\n  limit 1;\r\n\r\n  if v_prefix is not null then\r\n    return v_prefix;\r\n  end if;\r\n\r\n  v_token := public.inventory_normalize_category_token(p_category_name);\r\n  v_max_len := greatest(3, least(char_length(v_token), 8));\r\n\r\n  for v_len in 3..v_max_len loop\r\n    v_candidate := substr(v_token, 1, v_len);\r\n\r\n    insert into public.inventory_product_code_prefixes (\r\n      branch_id,\r\n      category_key,\r\n      category_name,\r\n      prefix\r\n    )\r\n    values (\r\n      p_branch_id,\r\n      v_key,\r\n      trim(p_category_name),\r\n      v_candidate\r\n    )\r\n    on conflict do nothing\r\n    returning prefix into v_prefix;\r\n\r\n    if v_prefix is not null then\r\n      return v_prefix;\r\n    end if;\r\n\r\n    select p.prefix\r\n    into v_prefix\r\n    from public.inventory_product_code_prefixes p\r\n    where p.branch_id = p_branch_id\r\n      and p.category_key = v_key\r\n    limit 1;\r\n\r\n    if v_prefix is not null then\r\n      update public.inventory_product_code_prefixes\r\n      set\r\n        category_name = trim(p_category_name),\r\n        updated_at = now()\r\n      where branch_id = p_branch_id\r\n        and category_key = v_key;\r\n\r\n      return v_prefix;\r\n    end if;\r\n  end loop;\r\n\r\n  loop\r\n    v_candidate := substr(v_token, 1, 3) || v_suffix::text;\r\n\r\n    insert into public.inventory_product_code_prefixes (\r\n      branch_id,\r\n      category_key,\r\n      category_name,\r\n      prefix\r\n    )\r\n    values (\r\n      p_branch_id,\r\n      v_key,\r\n      trim(p_category_name),\r\n      v_candidate\r\n    )\r\n    on conflict do nothing\r\n    returning prefix into v_prefix;\r\n\r\n    if v_prefix is not null then\r\n      return v_prefix;\r\n    end if;\r\n\r\n    select p.prefix\r\n    into v_prefix\r\n    from public.inventory_product_code_prefixes p\r\n    where p.branch_id = p_branch_id\r\n      and p.category_key = v_key\r\n    limit 1;\r\n\r\n    if v_prefix is not null then\r\n      update public.inventory_product_code_prefixes\r\n      set\r\n        category_name = trim(p_category_name),\r\n        updated_at = now()\r\n      where branch_id = p_branch_id\r\n        and category_key = v_key;\r\n\r\n      return v_prefix;\r\n    end if;\r\n\r\n    v_suffix := v_suffix + 1;\r\n    if v_suffix > 99999 then\r\n      raise exception 'Unable to allocate product code prefix for category %', p_category_name;\r\n    end if;\r\n  end loop;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "is_admin",
    "parameters": "p_user_id uuid",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid DEFAULT current_request_user_id())\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  SELECT EXISTS (\r\n    SELECT 1\r\n    FROM public.users u\r\n    JOIN public.roles r ON r.id = u.role_id\r\n    WHERE u.id = p_user_id\r\n      AND u.is_active = true\r\n      AND r.name = 'admin'\r\n  );\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "open_cash_session",
    "parameters": "p_opening_amount numeric, p_opening_notes text, p_branch_id uuid",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.open_cash_session(p_opening_amount numeric, p_opening_notes text DEFAULT NULL::text, p_branch_id uuid DEFAULT NULL::uuid)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_user_branch_id uuid;\r\n  v_branch_id uuid;\r\n  v_user_id uuid;\r\n  v_cash_session_id uuid;\r\n  v_role text;\r\nBEGIN\r\n  IF NOT public.cash_can_open_close() THEN\r\n    RAISE EXCEPTION 'Only admin, manager or employee can open cash sessions';\r\n  END IF;\r\n\r\n  v_role := public.cash_current_role_name();\r\n  v_user_id := public.current_request_user_id();\r\n  IF v_user_id IS NULL THEN\r\n    RAISE EXCEPTION 'No hay sesión autenticada para apertura de caja.';\r\n  END IF;\r\n\r\n  v_user_branch_id := public.current_user_branch_id();\r\n  IF v_user_branch_id IS NULL THEN\r\n    RAISE EXCEPTION 'No branch assigned for current user';\r\n  END IF;\r\n\r\n  IF public.cash_is_admin() THEN\r\n    v_branch_id := coalesce(p_branch_id, v_user_branch_id);\r\n  ELSE\r\n    v_branch_id := v_user_branch_id;\r\n    IF p_branch_id IS NOT NULL AND p_branch_id <> v_user_branch_id THEN\r\n      RAISE EXCEPTION 'Solo admin puede abrir caja en otra sucursal';\r\n    END IF;\r\n  END IF;\r\n\r\n  IF p_opening_amount IS NULL OR p_opening_amount < 0 THEN\r\n    RAISE EXCEPTION 'Opening amount must be greater or equal to zero';\r\n  END IF;\r\n\r\n  IF EXISTS (\r\n    SELECT 1\r\n    FROM public.cash_sessions s\r\n    WHERE s.branch_id = v_branch_id\r\n      AND s.status = 'open'\r\n  ) THEN\r\n    RAISE EXCEPTION 'Ya existe una caja abierta para esta sucursal';\r\n  END IF;\r\n\r\n  INSERT INTO public.cash_sessions (\r\n    branch_id,\r\n    opened_by,\r\n    opening_role,\r\n    opening_amount,\r\n    opening_notes,\r\n    status,\r\n    opened_at\r\n  )\r\n  VALUES (\r\n    v_branch_id,\r\n    v_user_id,\r\n    v_role,\r\n    p_opening_amount,\r\n    nullif(trim(coalesce(p_opening_notes, '')), ''),\r\n    'open',\r\n    now()\r\n  )\r\n  RETURNING id INTO v_cash_session_id;\r\n\r\n  PERFORM public.capture_cash_inventory_snapshot(v_cash_session_id, 'open');\r\n\r\n  RETURN v_cash_session_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_approve_queued_sale",
    "parameters": "p_queue_id uuid, p_approval_notes text",
    "return_type": "TABLE(sale_id uuid, queue_id uuid, total_amount_bob numeric, total_amount_usd numeric)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_approve_queued_sale(p_queue_id uuid, p_approval_notes text DEFAULT NULL::text)\n RETURNS TABLE(sale_id uuid, queue_id uuid, total_amount_bob numeric, total_amount_usd numeric)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_queue public.pos_sale_queue%rowtype;\r\n  v_items jsonb;\r\n  v_created_sale uuid;\r\n  v_total_bob numeric;\r\n  v_total_usd numeric;\r\n  v_cash_movement uuid;\r\n  v_role text;\r\n  v_branch_id uuid;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n  IF NOT public.pos_can_approve_queue_sale() THEN\r\n    RAISE EXCEPTION 'Only employee, manager or admin can approve queued sales';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_queue\r\n  FROM public.pos_sale_queue q\r\n  WHERE q.id = p_queue_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Queued sale not found';\r\n  END IF;\r\n\r\n  IF v_queue.status <> 'queued' THEN\r\n    RAISE EXCEPTION 'Queued sale is already processed';\r\n  END IF;\r\n\r\n  v_branch_id := public.pos_resolve_branch(v_queue.branch_id);\r\n  IF v_branch_id <> v_queue.branch_id THEN\r\n    RAISE EXCEPTION 'Invalid branch context for queue approval';\r\n  END IF;\r\n\r\n  SELECT coalesce(\r\n    jsonb_agg(\r\n      jsonb_build_object(\r\n        'part_id', qi.part_id,\r\n        'quantity', qi.quantity,\r\n        'unit_price', qi.unit_price,\r\n        'source_type', qi.source_type,\r\n        'source_kit_id', qi.source_kit_id\r\n      )\r\n    ),\r\n    '[]'::jsonb\r\n  )\r\n  INTO v_items\r\n  FROM public.pos_sale_queue_items qi\r\n  WHERE qi.queue_id = v_queue.id;\r\n\r\n  SELECT s.sale_id, s.total_amount_bob, s.total_amount_usd, s.cash_movement_id\r\n  INTO v_created_sale, v_total_bob, v_total_usd, v_cash_movement\r\n  FROM public.pos_create_sale(\r\n    v_queue.branch_id,\r\n    v_queue.customer_name,\r\n    v_queue.payment_method,\r\n    v_queue.payment_currency,\r\n    v_queue.exchange_rate,\r\n    v_queue.sale_mode,\r\n    v_queue.advance_amount,\r\n    v_items,\r\n    jsonb_build_object('queued_sale_id', v_queue.id)\r\n  ) s;\r\n\r\n  UPDATE public.pos_sale_queue\r\n  SET\r\n    status = 'approved',\r\n    approved_by = public.current_request_user_id(),\r\n    approved_by_role = v_role,\r\n    approved_sale_id = v_created_sale,\r\n    approval_notes = nullif(trim(coalesce(p_approval_notes, '')), ''),\r\n    approved_at = now(),\r\n    updated_at = now()\r\n  WHERE id = v_queue.id;\r\n\r\n  RETURN QUERY\r\n  SELECT v_created_sale, v_queue.id, v_total_bob, v_total_usd;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_can_approve_queue_sale",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_can_approve_queue_sale()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  SELECT coalesce(public.pos_current_role_name() IN ('admin', 'manager', 'employee'), false);\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_can_queue_sale",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_can_queue_sale()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  SELECT coalesce(public.pos_current_role_name() = 'read_only', false);\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_can_sell_direct",
    "parameters": "",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_can_sell_direct()\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  SELECT coalesce(public.pos_current_role_name() IN ('admin', 'manager', 'employee'), false);\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_create_sale",
    "parameters": "p_branch_id uuid, p_customer_name text, p_payment_method text, p_payment_currency text, p_exchange_rate numeric, p_sale_mode text, p_advance_amount numeric, p_items jsonb, p_metadata jsonb",
    "return_type": "TABLE(sale_id uuid, total_amount_bob numeric, total_amount_usd numeric, cash_movement_id uuid)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_create_sale(p_branch_id uuid, p_customer_name text, p_payment_method text, p_payment_currency text DEFAULT 'BOB'::text, p_exchange_rate numeric DEFAULT 1, p_sale_mode text DEFAULT 'immediate'::text, p_advance_amount numeric DEFAULT 0, p_items jsonb DEFAULT '[]'::jsonb, p_metadata jsonb DEFAULT '{}'::jsonb)\n RETURNS TABLE(sale_id uuid, total_amount_bob numeric, total_amount_usd numeric, cash_movement_id uuid)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_sale_id uuid;\r\n  v_branch_id uuid;\r\n  v_role text;\r\n  v_user_id uuid;\r\n  v_item jsonb;\r\n  v_part record;\r\n  v_inventory record;\r\n  v_part_id uuid;\r\n  v_qty numeric(12,3);\r\n  v_unit_price numeric(12,2);\r\n  v_line_total numeric(12,2);\r\n  v_line_discount numeric(12,2);\r\n  v_source_type text;\r\n  v_source_kit_id text;\r\n  v_subtotal numeric(12,2) := 0;\r\n  v_total_bob numeric(12,2) := 0;\r\n  v_total_usd numeric(12,2) := 0;\r\n  v_exchange_rate numeric(12,6);\r\n  v_currency text;\r\n  v_payment_method text;\r\n  v_sale_mode text;\r\n  v_advance_amount numeric(12,2);\r\n  v_pending_amount numeric(12,2);\r\n  v_delivery_status text;\r\n  v_item_count integer := 0;\r\n  v_cash_amount numeric(12,2) := 0;\r\n  v_cash_movement_id uuid := NULL;\r\n  v_cash_movement_type text;\r\n  v_cash_session public.cash_sessions%rowtype;\r\n  v_queue_job_id uuid;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n  IF NOT public.pos_can_sell_direct() THEN\r\n    RAISE EXCEPTION 'Only admin, manager or employee can create direct sales';\r\n  END IF;\r\n\r\n  v_user_id := public.current_request_user_id();\r\n  IF v_user_id IS NULL THEN\r\n    RAISE EXCEPTION 'No active authenticated session';\r\n  END IF;\r\n\r\n  v_branch_id := public.pos_resolve_branch(p_branch_id);\r\n  v_payment_method := lower(trim(coalesce(p_payment_method, '')));\r\n  v_currency := upper(trim(coalesce(p_payment_currency, 'BOB')));\r\n  v_sale_mode := lower(trim(coalesce(p_sale_mode, 'immediate')));\r\n  v_exchange_rate := coalesce(p_exchange_rate, 1);\r\n\r\n  IF v_payment_method NOT IN ('cash', 'card', 'qr') THEN\r\n    RAISE EXCEPTION 'Payment method must be cash, card or qr';\r\n  END IF;\r\n\r\n  IF v_currency NOT IN ('BOB', 'USD') THEN\r\n    RAISE EXCEPTION 'Payment currency must be BOB or USD';\r\n  END IF;\r\n\r\n  IF v_sale_mode NOT IN ('immediate', 'advance') THEN\r\n    RAISE EXCEPTION 'Sale mode must be immediate or advance';\r\n  END IF;\r\n\r\n  IF v_exchange_rate <= 0 THEN\r\n    RAISE EXCEPTION 'Exchange rate must be greater than zero';\r\n  END IF;\r\n\r\n  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN\r\n    RAISE EXCEPTION 'At least one sale item is required';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_cash_session\r\n  FROM public.cash_sessions s\r\n  WHERE s.branch_id = v_branch_id\r\n    AND s.status = 'open'\r\n  ORDER BY s.opened_at DESC\r\n  LIMIT 1\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'A cash session must be open before creating sales for branch %', v_branch_id;\r\n  END IF;\r\n\r\n  INSERT INTO public.pos_sales (\r\n    branch_id,\r\n    cash_session_id,\r\n    sold_by,\r\n    customer_name,\r\n    payment_method,\r\n    payment_currency,\r\n    exchange_rate,\r\n    subtotal_amount,\r\n    discount_amount,\r\n    total_amount,\r\n    sale_mode,\r\n    advance_amount,\r\n    pending_amount,\r\n    delivery_status,\r\n    status,\r\n    metadata,\r\n    siat_status,\r\n    siat_response,\r\n    created_at,\r\n    updated_at\r\n  )\r\n  VALUES (\r\n    v_branch_id,\r\n    v_cash_session.id,\r\n    v_user_id,\r\n    nullif(trim(coalesce(p_customer_name, '')), ''),\r\n    v_payment_method,\r\n    v_currency,\r\n    v_exchange_rate,\r\n    0,\r\n    0,\r\n    0,\r\n    v_sale_mode,\r\n    0,\r\n    0,\r\n    CASE WHEN v_sale_mode = 'advance' THEN 'pending' ELSE 'delivered' END,\r\n    'completed',\r\n    coalesce(p_metadata, '{}'::jsonb),\r\n    'queued',\r\n    '{}'::jsonb,\r\n    now(),\r\n    now()\r\n  )\r\n  RETURNING id INTO v_sale_id;\r\n\r\n  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)\r\n  LOOP\r\n    v_part_id := nullif(v_item->>'part_id', '')::uuid;\r\n    v_qty := coalesce((v_item->>'quantity')::numeric, 0);\r\n    v_unit_price := round(coalesce((v_item->>'unit_price')::numeric, 0), 2);\r\n    v_line_discount := round(greatest(coalesce((v_item->>'line_discount')::numeric, 0), 0), 2);\r\n    v_source_type := lower(trim(coalesce(v_item->>'source_type', 'product')));\r\n    v_source_kit_id := nullif(trim(coalesce(v_item->>'source_kit_id', '')), '');\r\n\r\n    IF v_part_id IS NULL OR v_qty <= 0 OR v_unit_price < 0 THEN\r\n      RAISE EXCEPTION 'Invalid sale item payload';\r\n    END IF;\r\n\r\n    IF v_source_type NOT IN ('product', 'kit_component') THEN\r\n      RAISE EXCEPTION 'source_type must be product or kit_component';\r\n    END IF;\r\n\r\n    SELECT p.*\r\n    INTO v_part\r\n    FROM public.parts p\r\n    WHERE p.id = v_part_id\r\n      AND p.branch_id = v_branch_id\r\n      AND coalesce(p.is_active, true)\r\n    LIMIT 1;\r\n\r\n    IF NOT FOUND THEN\r\n      RAISE EXCEPTION 'Product % does not belong to branch %', v_part_id, v_branch_id;\r\n    END IF;\r\n\r\n    SELECT i.*\r\n    INTO v_inventory\r\n    FROM public.inventory i\r\n    WHERE i.part_id = v_part_id\r\n      AND i.branch_id = v_branch_id\r\n    FOR UPDATE;\r\n\r\n    IF NOT FOUND THEN\r\n      RAISE EXCEPTION 'No inventory row found for product % in branch %', v_part_id, v_branch_id;\r\n    END IF;\r\n\r\n    IF coalesce(v_inventory.quantity, 0) < v_qty THEN\r\n      RAISE EXCEPTION 'Insufficient stock for product % in branch %', v_part_id, v_branch_id;\r\n    END IF;\r\n\r\n    v_line_total := round((v_qty * v_unit_price) - v_line_discount, 2);\r\n    IF v_line_total < 0 THEN\r\n      RAISE EXCEPTION 'Line total cannot be negative';\r\n    END IF;\r\n\r\n    INSERT INTO public.pos_sale_items (\r\n      sale_id,\r\n      branch_id,\r\n      part_id,\r\n      source_type,\r\n      source_kit_id,\r\n      part_code,\r\n      part_name,\r\n      quantity,\r\n      unit_price,\r\n      line_discount,\r\n      line_total,\r\n      delivered_quantity,\r\n      delivery_status,\r\n      created_at,\r\n      updated_at\r\n    )\r\n    VALUES (\r\n      v_sale_id,\r\n      v_branch_id,\r\n      v_part_id,\r\n      v_source_type,\r\n      v_source_kit_id,\r\n      v_part.code,\r\n      v_part.name,\r\n      v_qty,\r\n      v_unit_price,\r\n      v_line_discount,\r\n      v_line_total,\r\n      CASE WHEN v_sale_mode = 'advance' THEN 0 ELSE v_qty END,\r\n      CASE WHEN v_sale_mode = 'advance' THEN 'pending' ELSE 'delivered' END,\r\n      now(),\r\n      now()\r\n    );\r\n\r\n    PERFORM public.apply_inventory_delta(\r\n      v_part_id,\r\n      v_branch_id,\r\n      -v_qty,\r\n      'Venta POS',\r\n      'venta',\r\n      'pos_sales',\r\n      v_sale_id,\r\n      jsonb_build_object(\r\n        'source_type', v_source_type,\r\n        'source_kit_id', v_source_kit_id,\r\n        'payment_method', v_payment_method\r\n      )\r\n    );\r\n\r\n    v_subtotal := round(v_subtotal + v_line_total, 2);\r\n    v_item_count := v_item_count + 1;\r\n  END LOOP;\r\n\r\n  IF v_item_count = 0 THEN\r\n    RAISE EXCEPTION 'At least one valid sale item is required';\r\n  END IF;\r\n\r\n  v_total_bob := v_subtotal;\r\n  v_total_usd := round((v_total_bob / v_exchange_rate)::numeric, 2);\r\n\r\n  IF v_sale_mode = 'advance' THEN\r\n    v_advance_amount := round(least(greatest(coalesce(p_advance_amount, 0), 0), v_total_bob), 2);\r\n    v_pending_amount := round(v_total_bob - v_advance_amount, 2);\r\n    v_delivery_status := 'pending';\r\n    v_cash_amount := v_advance_amount;\r\n  ELSE\r\n    v_advance_amount := v_total_bob;\r\n    v_pending_amount := 0;\r\n    v_delivery_status := 'delivered';\r\n    v_cash_amount := v_total_bob;\r\n  END IF;\r\n\r\n  UPDATE public.pos_sales\r\n  SET\r\n    subtotal_amount = v_subtotal,\r\n    total_amount = v_total_bob,\r\n    advance_amount = v_advance_amount,\r\n    pending_amount = v_pending_amount,\r\n    delivery_status = v_delivery_status,\r\n    updated_at = now()\r\n  WHERE id = v_sale_id;\r\n\r\n  IF v_cash_amount > 0 THEN\r\n    v_cash_movement_type := public.pos_sale_cash_movement_type(v_payment_method, false);\r\n\r\n    INSERT INTO public.cash_movements (\r\n      cash_session_id,\r\n      branch_id,\r\n      movement_type,\r\n      amount,\r\n      description,\r\n      payment_method,\r\n      reference_table,\r\n      reference_id,\r\n      created_by,\r\n      updated_by,\r\n      metadata,\r\n      created_at,\r\n      updated_at\r\n    )\r\n    VALUES (\r\n      v_cash_session.id,\r\n      v_branch_id,\r\n      v_cash_movement_type,\r\n      v_cash_amount,\r\n      CASE WHEN v_sale_mode = 'advance' THEN 'Anticipo venta POS' ELSE 'Venta POS' END,\r\n      v_payment_method,\r\n      'pos_sales',\r\n      v_sale_id,\r\n      v_user_id,\r\n      v_user_id,\r\n      jsonb_build_object('sale_mode', v_sale_mode),\r\n      now(),\r\n      now()\r\n    )\r\n    RETURNING id INTO v_cash_movement_id;\r\n  END IF;\r\n\r\n  INSERT INTO public.billing_invoice_jobs (\r\n    sale_id,\r\n    status,\r\n    payload,\r\n    created_at,\r\n    updated_at\r\n  )\r\n  VALUES (\r\n    v_sale_id,\r\n    'queued',\r\n    jsonb_build_object(\r\n      'sale_id', v_sale_id,\r\n      'branch_id', v_branch_id,\r\n      'payment_method', v_payment_method,\r\n      'payment_currency', v_currency,\r\n      'exchange_rate', v_exchange_rate,\r\n      'sale_mode', v_sale_mode\r\n    ),\r\n    now(),\r\n    now()\r\n  )\r\n  RETURNING id INTO v_queue_job_id;\r\n\r\n  UPDATE public.pos_sales\r\n  SET\r\n    siat_status = 'queued',\r\n    siat_response = jsonb_build_object('job_id', v_queue_job_id),\r\n    updated_at = now()\r\n  WHERE id = v_sale_id;\r\n\r\n  RETURN QUERY\r\n  SELECT v_sale_id, v_total_bob, v_total_usd, v_cash_movement_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_create_sale_return",
    "parameters": "p_sale_id uuid, p_reason text, p_items jsonb, p_notes text",
    "return_type": "TABLE(return_id uuid, sale_id uuid, total_return_amount numeric)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_create_sale_return(p_sale_id uuid, p_reason text, p_items jsonb, p_notes text DEFAULT NULL::text)\n RETURNS TABLE(return_id uuid, sale_id uuid, total_return_amount numeric)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_sale public.pos_sales%rowtype;\r\n  v_role text;\r\n  v_user_id uuid;\r\n  v_return_id uuid;\r\n  v_total numeric(12,2) := 0;\r\n  v_item jsonb;\r\n  v_sale_item public.pos_sale_items%rowtype;\r\n  v_sale_item_id uuid;\r\n  v_part_id uuid;\r\n  v_qty numeric(12,3);\r\n  v_returned_before numeric(12,3);\r\n  v_line_total numeric(12,2);\r\n  v_session public.cash_sessions%rowtype;\r\n  v_cash_movement_type text;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n  IF NOT public.pos_can_sell_direct() THEN\r\n    RAISE EXCEPTION 'Only admin, manager or employee can register returns';\r\n  END IF;\r\n\r\n  v_user_id := public.current_request_user_id();\r\n  IF v_user_id IS NULL THEN\r\n    RAISE EXCEPTION 'No active authenticated session';\r\n  END IF;\r\n\r\n  IF nullif(trim(coalesce(p_reason, '')), '') IS NULL THEN\r\n    RAISE EXCEPTION 'Return reason is required';\r\n  END IF;\r\n\r\n  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN\r\n    RAISE EXCEPTION 'At least one return item is required';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_sale\r\n  FROM public.pos_sales s\r\n  WHERE s.id = p_sale_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Sale not found';\r\n  END IF;\r\n\r\n  IF v_role <> 'admin' AND v_sale.branch_id <> public.current_user_branch_id() THEN\r\n    RAISE EXCEPTION 'Cannot return sale from another branch';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_session\r\n  FROM public.cash_sessions c\r\n  WHERE c.branch_id = v_sale.branch_id\r\n    AND c.status = 'open'\r\n  ORDER BY c.opened_at DESC\r\n  LIMIT 1\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'A cash session must be open before processing returns';\r\n  END IF;\r\n\r\n  INSERT INTO public.pos_sale_returns (\r\n    sale_id,\r\n    branch_id,\r\n    cash_session_id,\r\n    returned_by,\r\n    reason,\r\n    notes,\r\n    status,\r\n    total_return_amount,\r\n    created_at,\r\n    updated_at\r\n  )\r\n  VALUES (\r\n    v_sale.id,\r\n    v_sale.branch_id,\r\n    v_session.id,\r\n    v_user_id,\r\n    trim(p_reason),\r\n    nullif(trim(coalesce(p_notes, '')), ''),\r\n    'completed',\r\n    0,\r\n    now(),\r\n    now()\r\n  )\r\n  RETURNING id INTO v_return_id;\r\n\r\n  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)\r\n  LOOP\r\n    v_sale_item_id := nullif(v_item->>'sale_item_id', '')::uuid;\r\n    v_part_id := nullif(v_item->>'part_id', '')::uuid;\r\n    v_qty := coalesce((v_item->>'quantity')::numeric, 0);\r\n\r\n    IF v_qty <= 0 THEN\r\n      RAISE EXCEPTION 'Return quantity must be greater than zero';\r\n    END IF;\r\n\r\n    IF v_sale_item_id IS NULL THEN\r\n      IF v_part_id IS NULL THEN\r\n        RAISE EXCEPTION 'Each return line requires sale_item_id or part_id';\r\n      END IF;\r\n\r\n      SELECT *\r\n      INTO v_sale_item\r\n      FROM public.pos_sale_items si\r\n      WHERE si.sale_id = v_sale.id\r\n        AND si.part_id = v_part_id\r\n      ORDER BY si.created_at ASC\r\n      LIMIT 1\r\n      FOR UPDATE;\r\n    ELSE\r\n      SELECT *\r\n      INTO v_sale_item\r\n      FROM public.pos_sale_items si\r\n      WHERE si.id = v_sale_item_id\r\n        AND si.sale_id = v_sale.id\r\n      FOR UPDATE;\r\n    END IF;\r\n\r\n    IF NOT FOUND THEN\r\n      RAISE EXCEPTION 'Sale item not found for return';\r\n    END IF;\r\n\r\n    SELECT coalesce(sum(ri.quantity), 0)\r\n    INTO v_returned_before\r\n    FROM public.pos_sale_return_items ri\r\n    JOIN public.pos_sale_returns r\r\n      ON r.id = ri.return_id\r\n    WHERE ri.sale_item_id = v_sale_item.id\r\n      AND r.status = 'completed';\r\n\r\n    IF (v_returned_before + v_qty) > v_sale_item.quantity THEN\r\n      RAISE EXCEPTION 'Return quantity exceeds sold quantity for item %', v_sale_item.id;\r\n    END IF;\r\n\r\n    v_line_total := round((v_qty * v_sale_item.unit_price)::numeric, 2);\r\n\r\n    INSERT INTO public.pos_sale_return_items (\r\n      return_id,\r\n      sale_item_id,\r\n      part_id,\r\n      quantity,\r\n      unit_price,\r\n      line_total,\r\n      created_at\r\n    )\r\n    VALUES (\r\n      v_return_id,\r\n      v_sale_item.id,\r\n      v_sale_item.part_id,\r\n      v_qty,\r\n      v_sale_item.unit_price,\r\n      v_line_total,\r\n      now()\r\n    );\r\n\r\n    PERFORM public.apply_inventory_delta(\r\n      v_sale_item.part_id,\r\n      v_sale.branch_id,\r\n      v_qty,\r\n      'Devolucion de venta POS',\r\n      'devolucion_venta',\r\n      'pos_sale_returns',\r\n      v_return_id,\r\n      jsonb_build_object('sale_id', v_sale.id, 'sale_item_id', v_sale_item.id)\r\n    );\r\n\r\n    v_total := round(v_total + v_line_total, 2);\r\n  END LOOP;\r\n\r\n  UPDATE public.pos_sale_returns\r\n  SET\r\n    total_return_amount = v_total,\r\n    updated_at = now()\r\n  WHERE id = v_return_id;\r\n\r\n  IF v_total > 0 THEN\r\n    v_cash_movement_type := public.pos_sale_cash_movement_type(v_sale.payment_method, true);\r\n\r\n    INSERT INTO public.cash_movements (\r\n      cash_session_id,\r\n      branch_id,\r\n      movement_type,\r\n      amount,\r\n      description,\r\n      payment_method,\r\n      reference_table,\r\n      reference_id,\r\n      created_by,\r\n      updated_by,\r\n      metadata,\r\n      created_at,\r\n      updated_at\r\n    )\r\n    VALUES (\r\n      v_session.id,\r\n      v_sale.branch_id,\r\n      v_cash_movement_type,\r\n      v_total,\r\n      'Devolucion venta POS',\r\n      v_sale.payment_method,\r\n      'pos_sale_returns',\r\n      v_return_id,\r\n      v_user_id,\r\n      v_user_id,\r\n      jsonb_build_object('sale_id', v_sale.id),\r\n      now(),\r\n      now()\r\n    );\r\n  END IF;\r\n\r\n  UPDATE public.pos_sales s\r\n  SET\r\n    status = CASE\r\n      WHEN NOT EXISTS (\r\n        SELECT 1\r\n        FROM public.pos_sale_items si\r\n        WHERE si.sale_id = s.id\r\n          AND si.quantity > (\r\n            SELECT coalesce(sum(ri.quantity), 0)\r\n            FROM public.pos_sale_return_items ri\r\n            JOIN public.pos_sale_returns sr ON sr.id = ri.return_id\r\n            WHERE ri.sale_item_id = si.id\r\n              AND sr.status = 'completed'\r\n          )\r\n      ) THEN 'cancelled'\r\n      ELSE s.status\r\n    END,\r\n    updated_at = now()\r\n  WHERE s.id = v_sale.id;\r\n\r\n  RETURN QUERY\r\n  SELECT v_return_id, v_sale.id, v_total;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_current_role_name",
    "parameters": "",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_current_role_name()\n RETURNS text\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  SELECT coalesce(public.current_user_role_name(), '');\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_enqueue_sale",
    "parameters": "p_branch_id uuid, p_customer_name text, p_payment_method text, p_payment_currency text, p_exchange_rate numeric, p_sale_mode text, p_advance_amount numeric, p_items jsonb",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_enqueue_sale(p_branch_id uuid, p_customer_name text, p_payment_method text, p_payment_currency text DEFAULT 'BOB'::text, p_exchange_rate numeric DEFAULT 1, p_sale_mode text DEFAULT 'immediate'::text, p_advance_amount numeric DEFAULT 0, p_items jsonb DEFAULT '[]'::jsonb)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_queue_id uuid;\r\n  v_item jsonb;\r\n  v_branch_id uuid;\r\n  v_user_id uuid;\r\n  v_role text;\r\n  v_part_id uuid;\r\n  v_qty numeric(12,3);\r\n  v_unit_price numeric(12,2);\r\n  v_line_total numeric(12,2);\r\n  v_total_bob numeric(12,2) := 0;\r\n  v_total_usd numeric(12,2) := 0;\r\n  v_part_name text;\r\n  v_source_type text;\r\n  v_source_kit_id text;\r\n  v_item_count integer := 0;\r\n  v_sale_mode text;\r\n  v_currency text;\r\n  v_exchange_rate numeric(12,6);\r\n  v_payment_method text;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n  IF NOT public.pos_can_queue_sale() THEN\r\n    RAISE EXCEPTION 'Only read_only role can queue sales';\r\n  END IF;\r\n\r\n  v_user_id := public.current_request_user_id();\r\n  IF v_user_id IS NULL THEN\r\n    RAISE EXCEPTION 'No active authenticated session';\r\n  END IF;\r\n\r\n  v_branch_id := public.pos_resolve_branch(p_branch_id);\r\n  v_payment_method := lower(trim(coalesce(p_payment_method, '')));\r\n  v_currency := upper(trim(coalesce(p_payment_currency, 'BOB')));\r\n  v_sale_mode := lower(trim(coalesce(p_sale_mode, 'immediate')));\r\n  v_exchange_rate := coalesce(p_exchange_rate, 1);\r\n\r\n  IF v_payment_method NOT IN ('cash', 'card', 'qr') THEN\r\n    RAISE EXCEPTION 'Payment method must be cash, card or qr';\r\n  END IF;\r\n\r\n  IF v_currency NOT IN ('BOB', 'USD') THEN\r\n    RAISE EXCEPTION 'Payment currency must be BOB or USD';\r\n  END IF;\r\n\r\n  IF v_sale_mode NOT IN ('immediate', 'advance') THEN\r\n    RAISE EXCEPTION 'Sale mode must be immediate or advance';\r\n  END IF;\r\n\r\n  IF v_exchange_rate <= 0 THEN\r\n    RAISE EXCEPTION 'Exchange rate must be greater than zero';\r\n  END IF;\r\n\r\n  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN\r\n    RAISE EXCEPTION 'At least one item is required';\r\n  END IF;\r\n\r\n  INSERT INTO public.pos_sale_queue (\r\n    branch_id,\r\n    created_by,\r\n    created_by_role,\r\n    customer_name,\r\n    payment_method,\r\n    payment_currency,\r\n    exchange_rate,\r\n    sale_mode,\r\n    advance_amount,\r\n    requested_delivery_status,\r\n    status\r\n  )\r\n  VALUES (\r\n    v_branch_id,\r\n    v_user_id,\r\n    v_role,\r\n    nullif(trim(coalesce(p_customer_name, '')), ''),\r\n    v_payment_method,\r\n    v_currency,\r\n    v_exchange_rate,\r\n    v_sale_mode,\r\n    greatest(coalesce(p_advance_amount, 0), 0),\r\n    CASE WHEN v_sale_mode = 'advance' THEN 'pending' ELSE 'delivered' END,\r\n    'queued'\r\n  )\r\n  RETURNING id INTO v_queue_id;\r\n\r\n  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)\r\n  LOOP\r\n    v_part_id := nullif(v_item->>'part_id', '')::uuid;\r\n    v_qty := coalesce((v_item->>'quantity')::numeric, 0);\r\n    v_unit_price := round(coalesce((v_item->>'unit_price')::numeric, 0), 2);\r\n    v_source_type := lower(trim(coalesce(v_item->>'source_type', 'product')));\r\n    v_source_kit_id := nullif(trim(coalesce(v_item->>'source_kit_id', '')), '');\r\n\r\n    IF v_part_id IS NULL OR v_qty <= 0 OR v_unit_price < 0 THEN\r\n      RAISE EXCEPTION 'Invalid queue item payload';\r\n    END IF;\r\n\r\n    SELECT p.name\r\n    INTO v_part_name\r\n    FROM public.parts p\r\n    WHERE p.id = v_part_id\r\n      AND p.branch_id = v_branch_id\r\n      AND coalesce(p.is_active, true);\r\n\r\n    IF NOT FOUND THEN\r\n      RAISE EXCEPTION 'Product % does not belong to branch %', v_part_id, v_branch_id;\r\n    END IF;\r\n\r\n    IF v_source_type NOT IN ('product', 'kit_component') THEN\r\n      RAISE EXCEPTION 'source_type must be product or kit_component';\r\n    END IF;\r\n\r\n    v_line_total := round((v_qty * v_unit_price)::numeric, 2);\r\n\r\n    INSERT INTO public.pos_sale_queue_items (\r\n      queue_id,\r\n      part_id,\r\n      source_type,\r\n      source_kit_id,\r\n      part_name,\r\n      quantity,\r\n      unit_price,\r\n      line_total\r\n    )\r\n    VALUES (\r\n      v_queue_id,\r\n      v_part_id,\r\n      v_source_type,\r\n      v_source_kit_id,\r\n      v_part_name,\r\n      v_qty,\r\n      v_unit_price,\r\n      v_line_total\r\n    );\r\n\r\n    v_total_bob := round(v_total_bob + v_line_total, 2);\r\n    v_item_count := v_item_count + 1;\r\n  END LOOP;\r\n\r\n  IF v_item_count = 0 THEN\r\n    RAISE EXCEPTION 'At least one valid queue item is required';\r\n  END IF;\r\n\r\n  v_total_usd := round((v_total_bob / v_exchange_rate)::numeric, 2);\r\n\r\n  UPDATE public.pos_sale_queue\r\n  SET\r\n    total_amount_bob = v_total_bob,\r\n    total_amount_usd = v_total_usd,\r\n    updated_at = now()\r\n  WHERE id = v_queue_id;\r\n\r\n  RETURN v_queue_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_get_catalog",
    "parameters": "p_branch_id uuid",
    "return_type": "TABLE(part_id uuid, code text, name text, category text, image_url text, price numeric, kit_price numeric, stock numeric, tracking_mode text, requires_serialization boolean)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_get_catalog(p_branch_id uuid DEFAULT NULL::uuid)\n RETURNS TABLE(part_id uuid, code text, name text, category text, image_url text, price numeric, kit_price numeric, stock numeric, tracking_mode text, requires_serialization boolean)\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_branch_id uuid;\r\n  v_role text;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n\r\n  IF v_role NOT IN ('admin', 'manager', 'employee', 'read_only') THEN\r\n    RAISE EXCEPTION 'Role % cannot access POS catalog', v_role;\r\n  END IF;\r\n\r\n  v_branch_id := public.pos_resolve_branch(p_branch_id);\r\n\r\n  RETURN QUERY\r\n  SELECT\r\n    p.id AS part_id,\r\n    p.code,\r\n    p.name,\r\n    coalesce(p.category, 'General') AS category,\r\n    p.image_url,\r\n    p.price,\r\n    p.kit_price,\r\n    coalesce(i.quantity, 0) AS stock,\r\n    p.tracking_mode,\r\n    p.requires_serialization\r\n  FROM public.parts p\r\n  LEFT JOIN public.inventory i\r\n    ON i.part_id = p.id\r\n   AND i.branch_id = v_branch_id\r\n  WHERE p.branch_id = v_branch_id\r\n    AND coalesce(p.is_active, true)\r\n  ORDER BY p.name ASC;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_get_pending_deliveries",
    "parameters": "p_branch_id uuid",
    "return_type": "TABLE(sale_id uuid, branch_id uuid, customer_name text, payment_method text, total_amount numeric, pending_amount numeric, delivery_status text, created_at timestamp with time zone, items jsonb)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_get_pending_deliveries(p_branch_id uuid DEFAULT NULL::uuid)\n RETURNS TABLE(sale_id uuid, branch_id uuid, customer_name text, payment_method text, total_amount numeric, pending_amount numeric, delivery_status text, created_at timestamp with time zone, items jsonb)\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_branch_id uuid;\r\n  v_role text;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n  IF v_role NOT IN ('admin', 'manager', 'employee', 'read_only') THEN\r\n    RAISE EXCEPTION 'Role % cannot access deliveries', v_role;\r\n  END IF;\r\n\r\n  v_branch_id := public.pos_resolve_branch(p_branch_id);\r\n\r\n  RETURN QUERY\r\n  SELECT\r\n    s.id,\r\n    s.branch_id,\r\n    s.customer_name,\r\n    s.payment_method,\r\n    s.total_amount,\r\n    s.pending_amount,\r\n    s.delivery_status,\r\n    s.created_at,\r\n    coalesce((\r\n      SELECT jsonb_agg(\r\n        jsonb_build_object(\r\n          'sale_item_id', i.id,\r\n          'part_id', i.part_id,\r\n          'part_name', i.part_name,\r\n          'quantity', i.quantity,\r\n          'delivered_quantity', i.delivered_quantity,\r\n          'delivery_status', i.delivery_status\r\n        )\r\n      )\r\n      FROM public.pos_sale_items i\r\n      WHERE i.sale_id = s.id\r\n    ), '[]'::jsonb) AS items\r\n  FROM public.pos_sales s\r\n  WHERE s.branch_id = v_branch_id\r\n    AND s.status = 'completed'\r\n    AND s.delivery_status <> 'delivered'\r\n  ORDER BY s.created_at DESC;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_get_queued_sales",
    "parameters": "p_branch_id uuid, p_status text",
    "return_type": "TABLE(queue_id uuid, branch_id uuid, created_by uuid, created_by_role text, customer_name text, payment_method text, payment_currency text, exchange_rate numeric, total_amount_bob numeric, total_amount_usd numeric, sale_mode text, advance_amount numeric, requested_delivery_status text, status text, approved_by uuid, approved_by_role text, approved_sale_id uuid, approval_notes text, created_at timestamp with time zone, approved_at timestamp with time zone, lines jsonb)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_get_queued_sales(p_branch_id uuid DEFAULT NULL::uuid, p_status text DEFAULT NULL::text)\n RETURNS TABLE(queue_id uuid, branch_id uuid, created_by uuid, created_by_role text, customer_name text, payment_method text, payment_currency text, exchange_rate numeric, total_amount_bob numeric, total_amount_usd numeric, sale_mode text, advance_amount numeric, requested_delivery_status text, status text, approved_by uuid, approved_by_role text, approved_sale_id uuid, approval_notes text, created_at timestamp with time zone, approved_at timestamp with time zone, lines jsonb)\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_role text;\r\n  v_branch_id uuid;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n  IF v_role NOT IN ('admin', 'manager', 'employee', 'read_only') THEN\r\n    RAISE EXCEPTION 'Role % cannot access queued sales', v_role;\r\n  END IF;\r\n\r\n  v_branch_id := public.pos_resolve_branch(p_branch_id);\r\n\r\n  RETURN QUERY\r\n  SELECT\r\n    q.id,\r\n    q.branch_id,\r\n    q.created_by,\r\n    q.created_by_role,\r\n    q.customer_name,\r\n    q.payment_method,\r\n    q.payment_currency,\r\n    q.exchange_rate,\r\n    q.total_amount_bob,\r\n    q.total_amount_usd,\r\n    q.sale_mode,\r\n    q.advance_amount,\r\n    q.requested_delivery_status,\r\n    q.status,\r\n    q.approved_by,\r\n    q.approved_by_role,\r\n    q.approved_sale_id,\r\n    q.approval_notes,\r\n    q.created_at,\r\n    q.approved_at,\r\n    coalesce((\r\n      SELECT jsonb_agg(\r\n        jsonb_build_object(\r\n          'id', qi.id,\r\n          'part_id', qi.part_id,\r\n          'part_name', qi.part_name,\r\n          'quantity', qi.quantity,\r\n          'unit_price', qi.unit_price,\r\n          'line_total', qi.line_total,\r\n          'source_type', qi.source_type,\r\n          'source_kit_id', qi.source_kit_id\r\n        )\r\n        ORDER BY qi.created_at ASC\r\n      )\r\n      FROM public.pos_sale_queue_items qi\r\n      WHERE qi.queue_id = q.id\r\n    ), '[]'::jsonb) AS lines\r\n  FROM public.pos_sale_queue q\r\n  WHERE q.branch_id = v_branch_id\r\n    AND (p_status IS NULL OR q.status = p_status)\r\n  ORDER BY q.created_at DESC;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_get_returns",
    "parameters": "p_branch_id uuid",
    "return_type": "TABLE(return_id uuid, sale_id uuid, branch_id uuid, returned_by uuid, reason text, status text, total_return_amount numeric, created_at timestamp with time zone, items jsonb)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_get_returns(p_branch_id uuid DEFAULT NULL::uuid)\n RETURNS TABLE(return_id uuid, sale_id uuid, branch_id uuid, returned_by uuid, reason text, status text, total_return_amount numeric, created_at timestamp with time zone, items jsonb)\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_branch_id uuid;\r\n  v_role text;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n  IF v_role NOT IN ('admin', 'manager', 'employee', 'read_only') THEN\r\n    RAISE EXCEPTION 'Role % cannot access returns', v_role;\r\n  END IF;\r\n\r\n  v_branch_id := public.pos_resolve_branch(p_branch_id);\r\n\r\n  RETURN QUERY\r\n  SELECT\r\n    r.id,\r\n    r.sale_id,\r\n    r.branch_id,\r\n    r.returned_by,\r\n    r.reason,\r\n    r.status,\r\n    r.total_return_amount,\r\n    r.created_at,\r\n    coalesce((\r\n      SELECT jsonb_agg(\r\n        jsonb_build_object(\r\n          'id', ri.id,\r\n          'sale_item_id', ri.sale_item_id,\r\n          'part_id', ri.part_id,\r\n          'quantity', ri.quantity,\r\n          'unit_price', ri.unit_price,\r\n          'line_total', ri.line_total\r\n        )\r\n      )\r\n      FROM public.pos_sale_return_items ri\r\n      WHERE ri.return_id = r.id\r\n    ), '[]'::jsonb) AS items\r\n  FROM public.pos_sale_returns r\r\n  WHERE r.branch_id = v_branch_id\r\n  ORDER BY r.created_at DESC;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_get_sales",
    "parameters": "p_branch_id uuid, p_include_voided boolean",
    "return_type": "TABLE(sale_id uuid, branch_id uuid, sold_by uuid, customer_name text, payment_method text, payment_currency text, total_amount numeric, sale_mode text, advance_amount numeric, pending_amount numeric, delivery_status text, status text, created_at timestamp with time zone, items jsonb)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_get_sales(p_branch_id uuid DEFAULT NULL::uuid, p_include_voided boolean DEFAULT true)\n RETURNS TABLE(sale_id uuid, branch_id uuid, sold_by uuid, customer_name text, payment_method text, payment_currency text, total_amount numeric, sale_mode text, advance_amount numeric, pending_amount numeric, delivery_status text, status text, created_at timestamp with time zone, items jsonb)\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_role text;\r\n  v_branch_id uuid;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n  IF v_role NOT IN ('admin', 'manager', 'employee', 'read_only') THEN\r\n    RAISE EXCEPTION 'Role % cannot access sales history', v_role;\r\n  END IF;\r\n\r\n  v_branch_id := public.pos_resolve_branch(p_branch_id);\r\n\r\n  RETURN QUERY\r\n  SELECT\r\n    s.id,\r\n    s.branch_id,\r\n    s.sold_by,\r\n    s.customer_name,\r\n    s.payment_method,\r\n    s.payment_currency,\r\n    s.total_amount,\r\n    s.sale_mode,\r\n    s.advance_amount,\r\n    s.pending_amount,\r\n    s.delivery_status,\r\n    s.status,\r\n    s.created_at,\r\n    coalesce((\r\n      SELECT jsonb_agg(\r\n        jsonb_build_object(\r\n          'id', i.id,\r\n          'part_id', i.part_id,\r\n          'part_code', i.part_code,\r\n          'part_name', i.part_name,\r\n          'quantity', i.quantity,\r\n          'unit_price', i.unit_price,\r\n          'line_total', i.line_total,\r\n          'delivered_quantity', i.delivered_quantity,\r\n          'delivery_status', i.delivery_status,\r\n          'source_type', i.source_type,\r\n          'source_kit_id', i.source_kit_id\r\n        )\r\n        ORDER BY i.created_at ASC\r\n      )\r\n      FROM public.pos_sale_items i\r\n      WHERE i.sale_id = s.id\r\n    ), '[]'::jsonb) AS items\r\n  FROM public.pos_sales s\r\n  WHERE s.branch_id = v_branch_id\r\n    AND (p_include_voided OR s.status = 'completed')\r\n  ORDER BY s.created_at DESC;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_register_sale_delivery",
    "parameters": "p_sale_id uuid, p_items jsonb, p_notes text",
    "return_type": "TABLE(delivery_event_id uuid, sale_id uuid, delivery_status text)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_register_sale_delivery(p_sale_id uuid, p_items jsonb, p_notes text DEFAULT NULL::text)\n RETURNS TABLE(delivery_event_id uuid, sale_id uuid, delivery_status text)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_sale public.pos_sales%rowtype;\r\n  v_role text;\r\n  v_user_id uuid;\r\n  v_event_id uuid;\r\n  v_item jsonb;\r\n  v_sale_item public.pos_sale_items%rowtype;\r\n  v_sale_item_id uuid;\r\n  v_qty numeric(12,3);\r\n  v_new_delivered numeric(12,3);\r\n  v_total_items integer;\r\n  v_delivered_items integer;\r\n  v_status text;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n  IF NOT public.pos_can_sell_direct() THEN\r\n    RAISE EXCEPTION 'Only admin, manager or employee can register deliveries';\r\n  END IF;\r\n\r\n  v_user_id := public.current_request_user_id();\r\n  IF v_user_id IS NULL THEN\r\n    RAISE EXCEPTION 'No active authenticated session';\r\n  END IF;\r\n\r\n  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN\r\n    RAISE EXCEPTION 'At least one delivery item is required';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_sale\r\n  FROM public.pos_sales s\r\n  WHERE s.id = p_sale_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Sale not found';\r\n  END IF;\r\n\r\n  IF v_sale.status <> 'completed' THEN\r\n    RAISE EXCEPTION 'Only completed sales can register deliveries';\r\n  END IF;\r\n\r\n  IF v_role <> 'admin' AND v_sale.branch_id <> public.current_user_branch_id() THEN\r\n    RAISE EXCEPTION 'Cannot register delivery for another branch';\r\n  END IF;\r\n\r\n  INSERT INTO public.pos_sale_delivery_events (\r\n    sale_id,\r\n    branch_id,\r\n    delivered_by,\r\n    notes,\r\n    created_at\r\n  )\r\n  VALUES (\r\n    v_sale.id,\r\n    v_sale.branch_id,\r\n    v_user_id,\r\n    nullif(trim(coalesce(p_notes, '')), ''),\r\n    now()\r\n  )\r\n  RETURNING id INTO v_event_id;\r\n\r\n  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)\r\n  LOOP\r\n    v_sale_item_id := nullif(v_item->>'sale_item_id', '')::uuid;\r\n    v_qty := coalesce((v_item->>'quantity')::numeric, 0);\r\n\r\n    IF v_sale_item_id IS NULL OR v_qty <= 0 THEN\r\n      RAISE EXCEPTION 'Invalid delivery item payload';\r\n    END IF;\r\n\r\n    SELECT *\r\n    INTO v_sale_item\r\n    FROM public.pos_sale_items si\r\n    WHERE si.id = v_sale_item_id\r\n      AND si.sale_id = v_sale.id\r\n    FOR UPDATE;\r\n\r\n    IF NOT FOUND THEN\r\n      RAISE EXCEPTION 'Sale item not found in selected sale';\r\n    END IF;\r\n\r\n    IF (v_sale_item.delivered_quantity + v_qty) > v_sale_item.quantity THEN\r\n      RAISE EXCEPTION 'Delivery quantity exceeds pending quantity for item %', v_sale_item.id;\r\n    END IF;\r\n\r\n    v_new_delivered := v_sale_item.delivered_quantity + v_qty;\r\n\r\n    UPDATE public.pos_sale_items\r\n    SET\r\n      delivered_quantity = v_new_delivered,\r\n      delivery_status = CASE\r\n        WHEN v_new_delivered >= quantity THEN 'delivered'\r\n        WHEN v_new_delivered > 0 THEN 'partial'\r\n        ELSE 'pending'\r\n      END,\r\n      updated_at = now()\r\n    WHERE id = v_sale_item.id;\r\n\r\n    INSERT INTO public.pos_sale_delivery_event_items (\r\n      event_id,\r\n      sale_item_id,\r\n      part_id,\r\n      quantity_delivered,\r\n      created_at\r\n    )\r\n    VALUES (\r\n      v_event_id,\r\n      v_sale_item.id,\r\n      v_sale_item.part_id,\r\n      v_qty,\r\n      now()\r\n    );\r\n  END LOOP;\r\n\r\n  SELECT\r\n    count(*),\r\n    count(*) FILTER (WHERE delivered_quantity >= quantity)\r\n  INTO v_total_items, v_delivered_items\r\n  FROM public.pos_sale_items\r\n  WHERE sale_id = v_sale.id;\r\n\r\n  v_status := CASE\r\n    WHEN v_total_items = 0 THEN 'pending'\r\n    WHEN v_delivered_items = 0 THEN 'pending'\r\n    WHEN v_delivered_items = v_total_items THEN 'delivered'\r\n    ELSE 'partial'\r\n  END;\r\n\r\n  UPDATE public.pos_sales\r\n  SET\r\n    delivery_status = v_status,\r\n    updated_at = now()\r\n  WHERE id = v_sale.id;\r\n\r\n  RETURN QUERY\r\n  SELECT v_event_id, v_sale.id, v_status;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_reject_queued_sale",
    "parameters": "p_queue_id uuid, p_reason text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_reject_queued_sale(p_queue_id uuid, p_reason text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_queue public.pos_sale_queue%rowtype;\r\n  v_role text;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n  IF NOT public.pos_can_approve_queue_sale() THEN\r\n    RAISE EXCEPTION 'Only employee, manager or admin can reject queued sales';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_queue\r\n  FROM public.pos_sale_queue q\r\n  WHERE q.id = p_queue_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Queued sale not found';\r\n  END IF;\r\n\r\n  IF v_queue.status <> 'queued' THEN\r\n    RAISE EXCEPTION 'Queued sale is already processed';\r\n  END IF;\r\n\r\n  PERFORM public.pos_resolve_branch(v_queue.branch_id);\r\n\r\n  UPDATE public.pos_sale_queue\r\n  SET\r\n    status = 'rejected',\r\n    approved_by = public.current_request_user_id(),\r\n    approved_by_role = v_role,\r\n    approval_notes = coalesce(nullif(trim(p_reason), ''), 'Rejected by approver'),\r\n    approved_at = now(),\r\n    updated_at = now()\r\n  WHERE id = v_queue.id;\r\n\r\n  RETURN v_queue.id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_resolve_branch",
    "parameters": "p_branch_id uuid",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_resolve_branch(p_branch_id uuid DEFAULT NULL::uuid)\n RETURNS uuid\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_role text;\r\n  v_user_branch uuid;\r\n  v_result uuid;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n  v_user_branch := public.current_user_branch_id();\r\n\r\n  IF v_role = 'admin' THEN\r\n    v_result := coalesce(p_branch_id, v_user_branch);\r\n  ELSE\r\n    IF v_user_branch IS NULL THEN\r\n      RAISE EXCEPTION 'No branch associated with current user';\r\n    END IF;\r\n\r\n    IF p_branch_id IS NOT NULL AND p_branch_id <> v_user_branch THEN\r\n      RAISE EXCEPTION 'Role % cannot operate branch %', v_role, p_branch_id;\r\n    END IF;\r\n\r\n    v_result := v_user_branch;\r\n  END IF;\r\n\r\n  IF v_result IS NULL THEN\r\n    RAISE EXCEPTION 'Target branch is required';\r\n  END IF;\r\n\r\n  RETURN v_result;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_sale_cash_movement_type",
    "parameters": "p_payment_method text, p_is_return boolean",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_sale_cash_movement_type(p_payment_method text, p_is_return boolean DEFAULT false)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\r\nDECLARE\r\n  v_method text;\r\nBEGIN\r\n  v_method := lower(trim(coalesce(p_payment_method, '')));\r\n\r\n  IF v_method = 'cash' THEN\r\n    RETURN CASE WHEN p_is_return THEN 'sale_return_cash' ELSE 'sale_cash' END;\r\n  ELSIF v_method = 'card' THEN\r\n    RETURN CASE WHEN p_is_return THEN 'sale_return_card' ELSE 'sale_card' END;\r\n  ELSIF v_method = 'qr' THEN\r\n    RETURN CASE WHEN p_is_return THEN 'sale_return_qr' ELSE 'sale_qr' END;\r\n  END IF;\r\n\r\n  RAISE EXCEPTION 'Unsupported payment method: %', p_payment_method;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "pos_void_sale",
    "parameters": "p_sale_id uuid, p_reason text",
    "return_type": "TABLE(sale_id uuid, reversed_amount numeric)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.pos_void_sale(p_sale_id uuid, p_reason text)\n RETURNS TABLE(sale_id uuid, reversed_amount numeric)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_sale public.pos_sales%rowtype;\r\n  v_role text;\r\n  v_user_id uuid;\r\n  v_item public.pos_sale_items%rowtype;\r\n  v_returned numeric(12,3);\r\n  v_net_qty numeric(12,3);\r\n  v_reversed numeric(12,2) := 0;\r\n  v_session public.cash_sessions%rowtype;\r\n  v_cash_movement_type text;\r\nBEGIN\r\n  v_role := public.pos_current_role_name();\r\n  IF v_role NOT IN ('admin', 'manager') THEN\r\n    RAISE EXCEPTION 'Only admin or manager can void sales';\r\n  END IF;\r\n\r\n  v_user_id := public.current_request_user_id();\r\n  IF v_user_id IS NULL THEN\r\n    RAISE EXCEPTION 'No active authenticated session';\r\n  END IF;\r\n\r\n  IF nullif(trim(coalesce(p_reason, '')), '') IS NULL THEN\r\n    RAISE EXCEPTION 'Void reason is required';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_sale\r\n  FROM public.pos_sales s\r\n  WHERE s.id = p_sale_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Sale not found';\r\n  END IF;\r\n\r\n  IF v_sale.status <> 'completed' THEN\r\n    RAISE EXCEPTION 'Only completed sales can be voided';\r\n  END IF;\r\n\r\n  IF v_role <> 'admin' AND v_sale.branch_id <> public.current_user_branch_id() THEN\r\n    RAISE EXCEPTION 'Cannot void sale from another branch';\r\n  END IF;\r\n\r\n  FOR v_item IN\r\n    SELECT *\r\n    FROM public.pos_sale_items si\r\n    WHERE si.sale_id = v_sale.id\r\n    FOR UPDATE\r\n  LOOP\r\n    SELECT coalesce(sum(ri.quantity), 0)\r\n    INTO v_returned\r\n    FROM public.pos_sale_return_items ri\r\n    JOIN public.pos_sale_returns r ON r.id = ri.return_id\r\n    WHERE ri.sale_item_id = v_item.id\r\n      AND r.status = 'completed';\r\n\r\n    v_net_qty := v_item.quantity - v_returned;\r\n\r\n    IF v_net_qty > 0 THEN\r\n      PERFORM public.apply_inventory_delta(\r\n        v_item.part_id,\r\n        v_sale.branch_id,\r\n        v_net_qty,\r\n        'Anulacion de venta POS',\r\n        'devolucion_venta',\r\n        'pos_sales',\r\n        v_sale.id,\r\n        jsonb_build_object('sale_item_id', v_item.id, 'void_reason', p_reason)\r\n      );\r\n\r\n      v_reversed := round(v_reversed + (v_net_qty * v_item.unit_price), 2);\r\n    END IF;\r\n  END LOOP;\r\n\r\n  IF v_reversed > 0 THEN\r\n    SELECT *\r\n    INTO v_session\r\n    FROM public.cash_sessions c\r\n    WHERE c.branch_id = v_sale.branch_id\r\n      AND c.status = 'open'\r\n    ORDER BY c.opened_at DESC\r\n    LIMIT 1\r\n    FOR UPDATE;\r\n\r\n    IF NOT FOUND THEN\r\n      RAISE EXCEPTION 'A cash session must be open before voiding sales';\r\n    END IF;\r\n\r\n    v_cash_movement_type := public.pos_sale_cash_movement_type(v_sale.payment_method, true);\r\n\r\n    INSERT INTO public.cash_movements (\r\n      cash_session_id,\r\n      branch_id,\r\n      movement_type,\r\n      amount,\r\n      description,\r\n      payment_method,\r\n      reference_table,\r\n      reference_id,\r\n      created_by,\r\n      updated_by,\r\n      metadata,\r\n      created_at,\r\n      updated_at\r\n    )\r\n    VALUES (\r\n      v_session.id,\r\n      v_sale.branch_id,\r\n      v_cash_movement_type,\r\n      v_reversed,\r\n      'Anulacion de venta POS',\r\n      v_sale.payment_method,\r\n      'pos_sales',\r\n      v_sale.id,\r\n      v_user_id,\r\n      v_user_id,\r\n      jsonb_build_object('void_reason', p_reason),\r\n      now(),\r\n      now()\r\n    );\r\n  END IF;\r\n\r\n  UPDATE public.pos_sales\r\n  SET\r\n    status = 'voided',\r\n    void_reason = trim(p_reason),\r\n    updated_at = now()\r\n  WHERE id = v_sale.id;\r\n\r\n  RETURN QUERY\r\n  SELECT v_sale.id, v_reversed;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "record_cash_sale_movement",
    "parameters": "p_cash_session_id uuid, p_sale_id uuid, p_amount numeric, p_description text, p_metadata jsonb",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.record_cash_sale_movement(p_cash_session_id uuid, p_sale_id uuid, p_amount numeric, p_description text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_session public.cash_sessions%rowtype;\r\n  v_user_id uuid;\r\n  v_movement_id uuid;\r\nBEGIN\r\n  IF NOT public.cash_can_open_close() THEN\r\n    RAISE EXCEPTION 'Only admin, manager or employee can register sales in cash';\r\n  END IF;\r\n\r\n  IF p_amount IS NULL OR p_amount <= 0 THEN\r\n    RAISE EXCEPTION 'Sale amount must be greater than zero';\r\n  END IF;\r\n\r\n  IF p_sale_id IS NULL THEN\r\n    RAISE EXCEPTION 'Sale id is required';\r\n  END IF;\r\n\r\n  v_user_id := public.current_request_user_id();\r\n\r\n  SELECT *\r\n  INTO v_session\r\n  FROM public.cash_sessions s\r\n  WHERE s.id = p_cash_session_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Cash session not found';\r\n  END IF;\r\n\r\n  IF v_session.status <> 'open' THEN\r\n    RAISE EXCEPTION 'Cash session is closed';\r\n  END IF;\r\n\r\n  INSERT INTO public.cash_movements (\r\n    cash_session_id,\r\n    branch_id,\r\n    movement_type,\r\n    amount,\r\n    description,\r\n    payment_method,\r\n    reference_table,\r\n    reference_id,\r\n    created_by,\r\n    updated_by,\r\n    metadata,\r\n    created_at,\r\n    updated_at\r\n  )\r\n  VALUES (\r\n    v_session.id,\r\n    v_session.branch_id,\r\n    'sale_cash',\r\n    p_amount,\r\n    coalesce(nullif(trim(coalesce(p_description, '')), ''), 'Venta en efectivo'),\r\n    'cash',\r\n    'sales',\r\n    p_sale_id,\r\n    v_user_id,\r\n    v_user_id,\r\n    coalesce(p_metadata, '{}'::jsonb),\r\n    now(),\r\n    now()\r\n  )\r\n  RETURNING id INTO v_movement_id;\r\n\r\n  RETURN v_movement_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "record_cash_sale_return_movement",
    "parameters": "p_cash_session_id uuid, p_sale_id uuid, p_amount numeric, p_description text, p_metadata jsonb",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.record_cash_sale_return_movement(p_cash_session_id uuid, p_sale_id uuid, p_amount numeric, p_description text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_session public.cash_sessions%rowtype;\r\n  v_user_id uuid;\r\n  v_movement_id uuid;\r\nBEGIN\r\n  IF NOT public.cash_can_open_close() THEN\r\n    RAISE EXCEPTION 'Only admin, manager or employee can register cash sale returns';\r\n  END IF;\r\n\r\n  IF p_amount IS NULL OR p_amount <= 0 THEN\r\n    RAISE EXCEPTION 'Return amount must be greater than zero';\r\n  END IF;\r\n\r\n  IF p_sale_id IS NULL THEN\r\n    RAISE EXCEPTION 'Sale id is required';\r\n  END IF;\r\n\r\n  v_user_id := public.current_request_user_id();\r\n\r\n  SELECT *\r\n  INTO v_session\r\n  FROM public.cash_sessions s\r\n  WHERE s.id = p_cash_session_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Cash session not found';\r\n  END IF;\r\n\r\n  IF v_session.status <> 'open' THEN\r\n    RAISE EXCEPTION 'Cash session is closed';\r\n  END IF;\r\n\r\n  INSERT INTO public.cash_movements (\r\n    cash_session_id,\r\n    branch_id,\r\n    movement_type,\r\n    amount,\r\n    description,\r\n    payment_method,\r\n    reference_table,\r\n    reference_id,\r\n    created_by,\r\n    updated_by,\r\n    metadata,\r\n    created_at,\r\n    updated_at\r\n  )\r\n  VALUES (\r\n    v_session.id,\r\n    v_session.branch_id,\r\n    'sale_return_cash',\r\n    p_amount,\r\n    coalesce(nullif(trim(coalesce(p_description, '')), ''), 'Devolucion de venta en efectivo'),\r\n    'cash',\r\n    'sales',\r\n    p_sale_id,\r\n    v_user_id,\r\n    v_user_id,\r\n    coalesce(p_metadata, '{}'::jsonb),\r\n    now(),\r\n    now()\r\n  )\r\n  RETURNING id INTO v_movement_id;\r\n\r\n  RETURN v_movement_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "record_inventory_control",
    "parameters": "p_branch_id uuid, p_part_id uuid, p_counted_quantity numeric, p_control_reason text, p_notes text, p_apply_adjustment boolean",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.record_inventory_control(p_branch_id uuid, p_part_id uuid, p_counted_quantity numeric, p_control_reason text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_apply_adjustment boolean DEFAULT false)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_record_id uuid;\r\n  v_system_quantity numeric(12,3);\r\n  v_difference numeric(12,3);\r\n  v_reason text;\r\nbegin\r\n  if not public.inventory_has_management_access() then\r\n    raise exception 'Only admin or manager can register control';\r\n  end if;\r\n\r\n  if not public.inventory_can_manage_branch(p_branch_id) then\r\n    raise exception 'No permission for selected branch';\r\n  end if;\r\n\r\n  if p_counted_quantity is null or p_counted_quantity < 0 then\r\n    raise exception 'Counted quantity must be zero or greater';\r\n  end if;\r\n\r\n  select coalesce(i.quantity, 0)\r\n  into v_system_quantity\r\n  from public.inventory i\r\n  where i.part_id = p_part_id\r\n    and i.branch_id = p_branch_id;\r\n\r\n  v_system_quantity := coalesce(v_system_quantity, 0);\r\n  v_difference := p_counted_quantity - v_system_quantity;\r\n  v_reason := coalesce(nullif(trim(p_control_reason), ''), 'Control de inventario');\r\n\r\n  insert into public.inventory_control_records (\r\n    branch_id,\r\n    part_id,\r\n    counted_quantity,\r\n    system_quantity,\r\n    difference_quantity,\r\n    control_reason,\r\n    notes,\r\n    recorded_by,\r\n    recorded_at\r\n  )\r\n  values (\r\n    p_branch_id,\r\n    p_part_id,\r\n    p_counted_quantity,\r\n    v_system_quantity,\r\n    v_difference,\r\n    v_reason,\r\n    nullif(trim(coalesce(p_notes, '')), ''),\r\n    auth.uid(),\r\n    now()\r\n  )\r\n  returning id into v_record_id;\r\n\r\n  if p_apply_adjustment and v_difference <> 0 then\r\n    perform public.apply_inventory_delta(\r\n      p_part_id,\r\n      p_branch_id,\r\n      v_difference,\r\n      v_reason,\r\n      'ajuste_manual',\r\n      'inventory_control_records',\r\n      v_record_id,\r\n      jsonb_build_object('counted_quantity', p_counted_quantity, 'system_quantity', v_system_quantity)\r\n    );\r\n  end if;\r\n\r\n  return v_record_id;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "register_serialized_return",
    "parameters": "p_branch_id uuid, p_sale_id uuid, p_sale_item_id uuid, p_part_id uuid, p_serial_number text, p_reason text, p_returned_at timestamp with time zone, p_restock boolean",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.register_serialized_return(p_branch_id uuid, p_sale_id uuid, p_sale_item_id uuid, p_part_id uuid, p_serial_number text, p_reason text DEFAULT NULL::text, p_returned_at timestamp with time zone DEFAULT now(), p_restock boolean DEFAULT true)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_serial public.serialized_inventory_sales%rowtype;\r\n  v_window_days integer;\r\n  v_effective_returned_at timestamp with time zone;\r\nbegin\r\n  if not public.can_process_sales_inventory_flow() then\r\n    raise exception 'Only admin, manager or employee can process returns';\r\n  end if;\r\n\r\n  if p_sale_id is null then\r\n    raise exception 'Original sale id is required';\r\n  end if;\r\n\r\n  if p_sale_item_id is null then\r\n    raise exception 'Original sale item id is required';\r\n  end if;\r\n\r\n  if coalesce(trim(p_serial_number), '') = '' then\r\n    raise exception 'Serial number is required';\r\n  end if;\r\n\r\n  v_effective_returned_at := coalesce(p_returned_at, now());\r\n\r\n  select *\r\n  into v_serial\r\n  from public.serialized_inventory_sales s\r\n  where s.branch_id = p_branch_id\r\n    and s.part_id = p_part_id\r\n    and s.serial_number = trim(p_serial_number)\r\n    and s.sold_sale_id = p_sale_id\r\n    and s.sold_sale_item_id = p_sale_item_id\r\n    and s.status = 'sold'\r\n  for update;\r\n\r\n  if not found then\r\n    raise exception 'Serial does not match product, branch, or original sale';\r\n  end if;\r\n\r\n  if v_effective_returned_at < v_serial.sold_at then\r\n    raise exception 'Return date cannot be before sold date';\r\n  end if;\r\n\r\n  v_window_days := public.get_return_window_days(p_branch_id);\r\n\r\n  if v_effective_returned_at > (v_serial.sold_at + make_interval(days => v_window_days)) then\r\n    raise exception 'Return window exceeded (% days)', v_window_days;\r\n  end if;\r\n\r\n  update public.serialized_inventory_sales\r\n  set\r\n    status = 'returned',\r\n    returned_at = v_effective_returned_at,\r\n    returned_by = auth.uid(),\r\n    returned_reason = p_reason,\r\n    notes = case\r\n      when coalesce(p_reason, '') = '' then notes\r\n      when coalesce(notes, '') = '' then p_reason\r\n      else notes || ' | return_reason: ' || p_reason\r\n    end\r\n  where id = v_serial.id;\r\n\r\n  insert into public.serialized_inventory_events (\r\n    serialized_sale_id,\r\n    part_id,\r\n    branch_id,\r\n    serial_number,\r\n    sale_id,\r\n    sale_item_id,\r\n    event_type,\r\n    event_date,\r\n    performed_by,\r\n    notes\r\n  )\r\n  values (\r\n    v_serial.id,\r\n    v_serial.part_id,\r\n    v_serial.branch_id,\r\n    v_serial.serial_number,\r\n    v_serial.sold_sale_id,\r\n    v_serial.sold_sale_item_id,\r\n    'returned',\r\n    v_effective_returned_at,\r\n    auth.uid(),\r\n    p_reason\r\n  );\r\n\r\n  if p_restock then\r\n    insert into public.inventory (\r\n      part_id,\r\n      branch_id,\r\n      quantity,\r\n      min_quantity,\r\n      last_restock\r\n    )\r\n    values (\r\n      v_serial.part_id,\r\n      v_serial.branch_id,\r\n      1,\r\n      0,\r\n      v_effective_returned_at\r\n    )\r\n    on conflict (part_id, branch_id)\r\n    do update set\r\n      quantity = public.inventory.quantity + 1,\r\n      last_restock = excluded.last_restock,\r\n      updated_at = now();\r\n\r\n    insert into public.serialized_inventory_events (\r\n      serialized_sale_id,\r\n      part_id,\r\n      branch_id,\r\n      serial_number,\r\n      sale_id,\r\n      sale_item_id,\r\n      event_type,\r\n      event_date,\r\n      performed_by,\r\n      notes\r\n    )\r\n    values (\r\n      v_serial.id,\r\n      v_serial.part_id,\r\n      v_serial.branch_id,\r\n      v_serial.serial_number,\r\n      v_serial.sold_sale_id,\r\n      v_serial.sold_sale_item_id,\r\n      'restocked',\r\n      v_effective_returned_at,\r\n      auth.uid(),\r\n      'Auto restock from serialized return'\r\n    );\r\n  end if;\r\n\r\n  return v_serial.id;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "require_open_cash_session",
    "parameters": "p_branch_id uuid",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.require_open_cash_session(p_branch_id uuid DEFAULT NULL::uuid)\n RETURNS uuid\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_target_branch_id uuid;\r\n  v_cash_session_id uuid;\r\nBEGIN\r\n  IF public.cash_is_admin() THEN\r\n    v_target_branch_id := coalesce(p_branch_id, public.current_user_branch_id());\r\n  ELSE\r\n    v_target_branch_id := public.current_user_branch_id();\r\n  END IF;\r\n\r\n  SELECT s.id\r\n  INTO v_cash_session_id\r\n  FROM public.cash_sessions s\r\n  WHERE s.branch_id = v_target_branch_id\r\n    AND s.status = 'open'\r\n  ORDER BY s.opened_at DESC\r\n  LIMIT 1;\r\n\r\n  IF v_cash_session_id IS NULL THEN\r\n    RAISE EXCEPTION 'No hay caja abierta en tu sucursal. Debes abrir caja para procesar ventas.';\r\n  END IF;\r\n\r\n  RETURN v_cash_session_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "review_cash_movement_edit_request",
    "parameters": "p_request_id uuid, p_action text, p_review_notes text, p_apply_changes boolean",
    "return_type": "TABLE(request_id uuid, status text, applied boolean, movement_id uuid)",
    "full_definition": "CREATE OR REPLACE FUNCTION public.review_cash_movement_edit_request(p_request_id uuid, p_action text, p_review_notes text DEFAULT NULL::text, p_apply_changes boolean DEFAULT true)\n RETURNS TABLE(request_id uuid, status text, applied boolean, movement_id uuid)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_request public.cash_movement_edit_requests%rowtype;\r\n  v_movement public.cash_movements%rowtype;\r\n  v_user_id uuid;\r\n  v_action text;\r\n  v_applied boolean := false;\r\n  v_new_amount numeric(12,2);\r\n  v_new_description text;\r\nBEGIN\r\n  IF NOT public.cash_is_admin() THEN\r\n    RAISE EXCEPTION 'Only admin can review edit requests';\r\n  END IF;\r\n\r\n  v_user_id := public.current_request_user_id();\r\n  v_action := lower(coalesce(trim(p_action), ''));\r\n\r\n  IF v_action NOT IN ('approve', 'reject') THEN\r\n    RAISE EXCEPTION 'Invalid action. Use approve or reject';\r\n  END IF;\r\n\r\n  SELECT *\r\n  INTO v_request\r\n  FROM public.cash_movement_edit_requests r\r\n  WHERE r.id = p_request_id\r\n  FOR UPDATE;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Edit request not found';\r\n  END IF;\r\n\r\n  IF v_request.status <> 'pending' THEN\r\n    RAISE EXCEPTION 'Only pending requests can be reviewed';\r\n  END IF;\r\n\r\n  IF v_action = 'approve' AND coalesce(p_apply_changes, true) THEN\r\n    SELECT *\r\n    INTO v_movement\r\n    FROM public.cash_movements m\r\n    WHERE m.id = v_request.movement_id\r\n    FOR UPDATE;\r\n\r\n    IF NOT FOUND THEN\r\n      RAISE EXCEPTION 'Cash movement not found for request';\r\n    END IF;\r\n\r\n    v_new_amount := coalesce(v_request.proposed_amount, v_movement.amount);\r\n    v_new_description := coalesce(v_request.proposed_description, v_movement.description);\r\n\r\n    IF v_new_amount <= 0 THEN\r\n      RAISE EXCEPTION 'Resolved movement amount must be greater than zero';\r\n    END IF;\r\n\r\n    IF v_new_amount <> v_movement.amount OR v_new_description <> v_movement.description THEN\r\n      UPDATE public.cash_movements\r\n      SET\r\n        amount = v_new_amount,\r\n        description = v_new_description,\r\n        updated_by = v_user_id,\r\n        updated_at = now()\r\n      WHERE id = v_movement.id;\r\n\r\n      INSERT INTO public.cash_movement_edit_logs (\r\n        movement_id,\r\n        request_id,\r\n        branch_id,\r\n        changed_by,\r\n        change_type,\r\n        change_reason,\r\n        old_amount,\r\n        new_amount,\r\n        old_description,\r\n        new_description,\r\n        created_at\r\n      )\r\n      VALUES (\r\n        v_movement.id,\r\n        v_request.id,\r\n        v_movement.branch_id,\r\n        v_user_id,\r\n        'request_approved',\r\n        coalesce(nullif(trim(v_request.request_reason), ''), 'Aprobacion de solicitud de edicion'),\r\n        v_movement.amount,\r\n        v_new_amount,\r\n        v_movement.description,\r\n        v_new_description,\r\n        now()\r\n      );\r\n\r\n      v_applied := true;\r\n    END IF;\r\n  END IF;\r\n\r\n  UPDATE public.cash_movement_edit_requests\r\n  SET\r\n    status = case when v_action = 'approve' then 'approved' else 'rejected' end,\r\n    review_notes = nullif(trim(coalesce(p_review_notes, '')), ''),\r\n    reviewed_by = v_user_id,\r\n    reviewed_at = now(),\r\n    applied = v_applied,\r\n    updated_at = now()\r\n  WHERE id = v_request.id;\r\n\r\n  RETURN QUERY\r\n  SELECT\r\n    v_request.id,\r\n    case when v_action = 'approve' then 'approved' else 'rejected' end,\r\n    v_applied,\r\n    v_request.movement_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "set_limit",
    "parameters": "real",
    "return_type": "real",
    "full_definition": "CREATE OR REPLACE FUNCTION public.set_limit(real)\n RETURNS real\n LANGUAGE c\n STRICT\nAS '$libdir/pg_trgm', $function$set_limit$function$\n"
  },
  {
    "schema": "public",
    "function_name": "set_return_window_days",
    "parameters": "p_branch_id uuid, p_days integer",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.set_return_window_days(p_branch_id uuid, p_days integer)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_setting_id uuid;\r\nbegin\r\n  if not public.inventory_is_admin() then\r\n    raise exception 'Only admin can update return window';\r\n  end if;\r\n\r\n  if p_days < 1 then\r\n    raise exception 'Return window must be at least 1 day';\r\n  end if;\r\n\r\n  insert into public.inventory_return_settings (\r\n    branch_id,\r\n    return_window_days,\r\n    created_by,\r\n    updated_by\r\n  )\r\n  values (\r\n    p_branch_id,\r\n    p_days,\r\n    auth.uid(),\r\n    auth.uid()\r\n  )\r\n  on conflict (branch_id)\r\n  do update set\r\n    return_window_days = excluded.return_window_days,\r\n    updated_by = auth.uid(),\r\n    updated_at = now()\r\n  returning id into v_setting_id;\r\n\r\n  return v_setting_id;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "set_updated_at",
    "parameters": "",
    "return_type": "trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION public.set_updated_at()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n  NEW.updated_at = now();\r\n  RETURN NEW;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "show_limit",
    "parameters": "",
    "return_type": "real",
    "full_definition": "CREATE OR REPLACE FUNCTION public.show_limit()\n RETURNS real\n LANGUAGE c\n STABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$show_limit$function$\n"
  },
  {
    "schema": "public",
    "function_name": "show_trgm",
    "parameters": "text",
    "return_type": "text[]",
    "full_definition": "CREATE OR REPLACE FUNCTION public.show_trgm(text)\n RETURNS text[]\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$show_trgm$function$\n"
  },
  {
    "schema": "public",
    "function_name": "similarity",
    "parameters": "text, text",
    "return_type": "real",
    "full_definition": "CREATE OR REPLACE FUNCTION public.similarity(text, text)\n RETURNS real\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$similarity$function$\n"
  },
  {
    "schema": "public",
    "function_name": "similarity_dist",
    "parameters": "text, text",
    "return_type": "real",
    "full_definition": "CREATE OR REPLACE FUNCTION public.similarity_dist(text, text)\n RETURNS real\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$similarity_dist$function$\n"
  },
  {
    "schema": "public",
    "function_name": "similarity_op",
    "parameters": "text, text",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.similarity_op(text, text)\n RETURNS boolean\n LANGUAGE c\n STABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$similarity_op$function$\n"
  },
  {
    "schema": "public",
    "function_name": "strict_word_similarity",
    "parameters": "text, text",
    "return_type": "real",
    "full_definition": "CREATE OR REPLACE FUNCTION public.strict_word_similarity(text, text)\n RETURNS real\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$strict_word_similarity$function$\n"
  },
  {
    "schema": "public",
    "function_name": "strict_word_similarity_commutator_op",
    "parameters": "text, text",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.strict_word_similarity_commutator_op(text, text)\n RETURNS boolean\n LANGUAGE c\n STABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$strict_word_similarity_commutator_op$function$\n"
  },
  {
    "schema": "public",
    "function_name": "strict_word_similarity_dist_commutator_op",
    "parameters": "text, text",
    "return_type": "real",
    "full_definition": "CREATE OR REPLACE FUNCTION public.strict_word_similarity_dist_commutator_op(text, text)\n RETURNS real\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$strict_word_similarity_dist_commutator_op$function$\n"
  },
  {
    "schema": "public",
    "function_name": "strict_word_similarity_dist_op",
    "parameters": "text, text",
    "return_type": "real",
    "full_definition": "CREATE OR REPLACE FUNCTION public.strict_word_similarity_dist_op(text, text)\n RETURNS real\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$strict_word_similarity_dist_op$function$\n"
  },
  {
    "schema": "public",
    "function_name": "strict_word_similarity_op",
    "parameters": "text, text",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.strict_word_similarity_op(text, text)\n RETURNS boolean\n LANGUAGE c\n STABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$strict_word_similarity_op$function$\n"
  },
  {
    "schema": "public",
    "function_name": "update_branch",
    "parameters": "p_id uuid, p_name text, p_address text, p_phone text",
    "return_type": "branches",
    "full_definition": "CREATE OR REPLACE FUNCTION public.update_branch(p_id uuid, p_name text, p_address text DEFAULT NULL::text, p_phone text DEFAULT NULL::text)\n RETURNS branches\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_branch public.branches;\r\nBEGIN\r\n  PERFORM public.ensure_admin();\r\n\r\n  IF p_id IS NULL THEN\r\n    RAISE EXCEPTION 'El id de sucursal es obligatorio.';\r\n  END IF;\r\n\r\n  IF NULLIF(TRIM(p_name), '') IS NULL THEN\r\n    RAISE EXCEPTION 'El nombre de la sucursal es obligatorio.';\r\n  END IF;\r\n\r\n  UPDATE public.branches\r\n  SET\r\n    name = TRIM(p_name),\r\n    address = NULLIF(TRIM(COALESCE(p_address, '')), ''),\r\n    phone = NULLIF(TRIM(COALESCE(p_phone, '')), '')\r\n  WHERE id = p_id\r\n  RETURNING * INTO v_branch;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Sucursal no encontrada.';\r\n  END IF;\r\n\r\n  RETURN v_branch;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "update_user",
    "parameters": "p_id uuid, p_full_name text, p_email text, p_branch_id uuid, p_role_id uuid, p_is_active boolean, p_phone text",
    "return_type": "users",
    "full_definition": "CREATE OR REPLACE FUNCTION public.update_user(p_id uuid, p_full_name text, p_email text, p_branch_id uuid, p_role_id uuid, p_is_active boolean DEFAULT true, p_phone text DEFAULT NULL::text)\n RETURNS users\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n  v_user public.users;\r\nBEGIN\r\n  PERFORM public.ensure_admin();\r\n\r\n  IF p_id IS NULL THEN\r\n    RAISE EXCEPTION 'El id de usuario es obligatorio.';\r\n  END IF;\r\n\r\n  IF NULLIF(trim(p_full_name), '') IS NULL THEN\r\n    RAISE EXCEPTION 'El nombre es obligatorio.';\r\n  END IF;\r\n\r\n  IF NULLIF(trim(p_email), '') IS NULL THEN\r\n    RAISE EXCEPTION 'El correo es obligatorio.';\r\n  END IF;\r\n\r\n  IF NOT EXISTS (SELECT 1 FROM public.roles r WHERE r.id = p_role_id) THEN\r\n    RAISE EXCEPTION 'Rol no encontrado.';\r\n  END IF;\r\n\r\n  IF NOT EXISTS (SELECT 1 FROM public.branches b WHERE b.id = p_branch_id) THEN\r\n    RAISE EXCEPTION 'Sucursal no encontrada.';\r\n  END IF;\r\n\r\n  UPDATE public.users\r\n  SET\r\n    full_name = trim(p_full_name),\r\n    email = lower(trim(p_email)),\r\n    phone = NULLIF(trim(COALESCE(p_phone, '')), ''),\r\n    branch_id = p_branch_id,\r\n    role_id = p_role_id,\r\n    is_active = COALESCE(p_is_active, true)\r\n  WHERE id = p_id\r\n  RETURNING * INTO v_user;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Usuario no encontrado.';\r\n  END IF;\r\n\r\n  UPDATE public.user_roles\r\n  SET role_id = p_role_id\r\n  WHERE user_id = p_id;\r\n\r\n  RETURN v_user;\r\nEND;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "upsert_inventory_product",
    "parameters": "p_branch_id uuid, p_code text, p_name text, p_description text, p_category text, p_category_id uuid, p_image_url text, p_cost numeric, p_price numeric, p_kit_price numeric, p_quotation_min_price numeric, p_quotation_max_price numeric, p_tracking_mode text, p_requires_serialization boolean, p_initial_quantity numeric, p_min_quantity numeric, p_max_quantity numeric, p_price_tiers jsonb",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.upsert_inventory_product(p_branch_id uuid, p_code text, p_name text, p_description text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_category_id uuid DEFAULT NULL::uuid, p_image_url text DEFAULT NULL::text, p_cost numeric DEFAULT 0, p_price numeric DEFAULT 0, p_kit_price numeric DEFAULT 0, p_quotation_min_price numeric DEFAULT NULL::numeric, p_quotation_max_price numeric DEFAULT NULL::numeric, p_tracking_mode text DEFAULT 'none'::text, p_requires_serialization boolean DEFAULT false, p_initial_quantity numeric DEFAULT 0, p_min_quantity numeric DEFAULT 0, p_max_quantity numeric DEFAULT NULL::numeric, p_price_tiers jsonb DEFAULT '[]'::jsonb)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_part_id uuid;\r\n  v_tier jsonb;\r\n  v_tracking_mode text;\r\nbegin\r\n  if not public.inventory_is_admin() then\r\n    raise exception 'Only admin can create or update products';\r\n  end if;\r\n\r\n  v_tracking_mode := lower(coalesce(nullif(p_tracking_mode, ''), 'none'));\r\n  if v_tracking_mode not in ('none', 'serial', 'lot') then\r\n    raise exception 'Invalid tracking_mode value: %', p_tracking_mode;\r\n  end if;\r\n\r\n  insert into public.parts (\r\n    branch_id,\r\n    code,\r\n    name,\r\n    description,\r\n    category,\r\n    category_id,\r\n    image_url,\r\n    cost,\r\n    price,\r\n    kit_price,\r\n    quotation_min_price,\r\n    quotation_max_price,\r\n    tracking_mode,\r\n    requires_serialization,\r\n    created_by,\r\n    updated_by\r\n  )\r\n  values (\r\n    p_branch_id,\r\n    trim(p_code),\r\n    trim(p_name),\r\n    p_description,\r\n    p_category,\r\n    p_category_id,\r\n    p_image_url,\r\n    coalesce(p_cost, 0),\r\n    coalesce(p_price, 0),\r\n    coalesce(p_kit_price, 0),\r\n    p_quotation_min_price,\r\n    p_quotation_max_price,\r\n    v_tracking_mode,\r\n    coalesce(p_requires_serialization, false),\r\n    auth.uid(),\r\n    auth.uid()\r\n  )\r\n  on conflict (branch_id, code)\r\n  do update set\r\n    name = excluded.name,\r\n    description = excluded.description,\r\n    category = excluded.category,\r\n    category_id = excluded.category_id,\r\n    image_url = excluded.image_url,\r\n    cost = excluded.cost,\r\n    price = excluded.price,\r\n    kit_price = excluded.kit_price,\r\n    quotation_min_price = excluded.quotation_min_price,\r\n    quotation_max_price = excluded.quotation_max_price,\r\n    tracking_mode = excluded.tracking_mode,\r\n    requires_serialization = excluded.requires_serialization,\r\n    updated_by = auth.uid(),\r\n    updated_at = now()\r\n  returning id into v_part_id;\r\n\r\n  insert into public.inventory (\r\n    part_id,\r\n    branch_id,\r\n    quantity,\r\n    min_quantity,\r\n    last_restock\r\n  )\r\n  values (\r\n    v_part_id,\r\n    p_branch_id,\r\n    greatest(coalesce(p_initial_quantity, 0), 0),\r\n    greatest(coalesce(p_min_quantity, 0), 0),\r\n    now()\r\n  )\r\n  on conflict (part_id, branch_id)\r\n  do update set\r\n    quantity = excluded.quantity,\r\n    min_quantity = excluded.min_quantity,\r\n    last_restock = excluded.last_restock,\r\n    updated_at = now();\r\n\r\n  delete from public.product_price_tiers where part_id = v_part_id;\r\n\r\n  if jsonb_typeof(p_price_tiers) = 'array' then\r\n    for v_tier in select * from jsonb_array_elements(p_price_tiers)\r\n    loop\r\n      if coalesce((v_tier->>'min_quantity')::int, 0) >= 1 and coalesce((v_tier->>'price')::numeric, -1) >= 0 then\r\n        insert into public.product_price_tiers (part_id, min_quantity, price)\r\n        values (\r\n          v_part_id,\r\n          (v_tier->>'min_quantity')::int,\r\n          (v_tier->>'price')::numeric\r\n        )\r\n        on conflict (part_id, min_quantity)\r\n        do update set\r\n          price = excluded.price,\r\n          updated_at = now();\r\n      end if;\r\n    end loop;\r\n  end if;\r\n\r\n  if not exists (select 1 from public.product_price_tiers t where t.part_id = v_part_id and t.min_quantity = 1) then\r\n    insert into public.product_price_tiers (part_id, min_quantity, price)\r\n    values (v_part_id, 1, coalesce(p_price, 0))\r\n    on conflict (part_id, min_quantity) do nothing;\r\n  end if;\r\n\r\n  return v_part_id;\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "word_similarity",
    "parameters": "text, text",
    "return_type": "real",
    "full_definition": "CREATE OR REPLACE FUNCTION public.word_similarity(text, text)\n RETURNS real\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$word_similarity$function$\n"
  },
  {
    "schema": "public",
    "function_name": "word_similarity_commutator_op",
    "parameters": "text, text",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.word_similarity_commutator_op(text, text)\n RETURNS boolean\n LANGUAGE c\n STABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$word_similarity_commutator_op$function$\n"
  },
  {
    "schema": "public",
    "function_name": "word_similarity_dist_commutator_op",
    "parameters": "text, text",
    "return_type": "real",
    "full_definition": "CREATE OR REPLACE FUNCTION public.word_similarity_dist_commutator_op(text, text)\n RETURNS real\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$word_similarity_dist_commutator_op$function$\n"
  },
  {
    "schema": "public",
    "function_name": "word_similarity_dist_op",
    "parameters": "text, text",
    "return_type": "real",
    "full_definition": "CREATE OR REPLACE FUNCTION public.word_similarity_dist_op(text, text)\n RETURNS real\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$word_similarity_dist_op$function$\n"
  },
  {
    "schema": "public",
    "function_name": "word_similarity_op",
    "parameters": "text, text",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION public.word_similarity_op(text, text)\n RETURNS boolean\n LANGUAGE c\n STABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$word_similarity_op$function$\n"
  },
  {
    "schema": "realtime",
    "function_name": "apply_rls",
    "parameters": "wal jsonb, max_record_bytes integer",
    "return_type": "SETOF realtime.wal_rls",
    "full_definition": "CREATE OR REPLACE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024))\n RETURNS SETOF realtime.wal_rls\n LANGUAGE plpgsql\nAS $function$\ndeclare\n-- Regclass of the table e.g. public.notes\nentity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;\n\n-- I, U, D, T: insert, update ...\naction realtime.action = (\n    case wal ->> 'action'\n        when 'I' then 'INSERT'\n        when 'U' then 'UPDATE'\n        when 'D' then 'DELETE'\n        else 'ERROR'\n    end\n);\n\n-- Is row level security enabled for the table\nis_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;\n\nsubscriptions realtime.subscription[] = array_agg(subs)\n    from\n        realtime.subscription subs\n    where\n        subs.entity = entity_\n        -- Filter by action early - only get subscriptions interested in this action\n        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'\n        and (subs.action_filter = '*' or subs.action_filter = action::text);\n\n-- Subscription vars\nroles regrole[] = array_agg(distinct us.claims_role::text)\n    from\n        unnest(subscriptions) us;\n\nworking_role regrole;\nclaimed_role regrole;\nclaims jsonb;\n\nsubscription_id uuid;\nsubscription_has_access bool;\nvisible_to_subscription_ids uuid[] = '{}';\n\n-- structured info for wal's columns\ncolumns realtime.wal_column[];\n-- previous identity values for update/delete\nold_columns realtime.wal_column[];\n\nerror_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;\n\n-- Primary jsonb output for record\noutput jsonb;\n\nbegin\nperform set_config('role', null, true);\n\ncolumns =\n    array_agg(\n        (\n            x->>'name',\n            x->>'type',\n            x->>'typeoid',\n            realtime.cast(\n                (x->'value') #>> '{}',\n                coalesce(\n                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4\n                    (x->>'type')::regtype\n                )\n            ),\n            (pks ->> 'name') is not null,\n            true\n        )::realtime.wal_column\n    )\n    from\n        jsonb_array_elements(wal -> 'columns') x\n        left join jsonb_array_elements(wal -> 'pk') pks\n            on (x ->> 'name') = (pks ->> 'name');\n\nold_columns =\n    array_agg(\n        (\n            x->>'name',\n            x->>'type',\n            x->>'typeoid',\n            realtime.cast(\n                (x->'value') #>> '{}',\n                coalesce(\n                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4\n                    (x->>'type')::regtype\n                )\n            ),\n            (pks ->> 'name') is not null,\n            true\n        )::realtime.wal_column\n    )\n    from\n        jsonb_array_elements(wal -> 'identity') x\n        left join jsonb_array_elements(wal -> 'pk') pks\n            on (x ->> 'name') = (pks ->> 'name');\n\nfor working_role in select * from unnest(roles) loop\n\n    -- Update `is_selectable` for columns and old_columns\n    columns =\n        array_agg(\n            (\n                c.name,\n                c.type_name,\n                c.type_oid,\n                c.value,\n                c.is_pkey,\n                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')\n            )::realtime.wal_column\n        )\n        from\n            unnest(columns) c;\n\n    old_columns =\n            array_agg(\n                (\n                    c.name,\n                    c.type_name,\n                    c.type_oid,\n                    c.value,\n                    c.is_pkey,\n                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')\n                )::realtime.wal_column\n            )\n            from\n                unnest(old_columns) c;\n\n    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then\n        return next (\n            jsonb_build_object(\n                'schema', wal ->> 'schema',\n                'table', wal ->> 'table',\n                'type', action\n            ),\n            is_rls_enabled,\n            -- subscriptions is already filtered by entity\n            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),\n            array['Error 400: Bad Request, no primary key']\n        )::realtime.wal_rls;\n\n    -- The claims role does not have SELECT permission to the primary key of entity\n    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then\n        return next (\n            jsonb_build_object(\n                'schema', wal ->> 'schema',\n                'table', wal ->> 'table',\n                'type', action\n            ),\n            is_rls_enabled,\n            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),\n            array['Error 401: Unauthorized']\n        )::realtime.wal_rls;\n\n    else\n        output = jsonb_build_object(\n            'schema', wal ->> 'schema',\n            'table', wal ->> 'table',\n            'type', action,\n            'commit_timestamp', to_char(\n                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),\n                'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"'\n            ),\n            'columns', (\n                select\n                    jsonb_agg(\n                        jsonb_build_object(\n                            'name', pa.attname,\n                            'type', pt.typname\n                        )\n                        order by pa.attnum asc\n                    )\n                from\n                    pg_attribute pa\n                    join pg_type pt\n                        on pa.atttypid = pt.oid\n                where\n                    attrelid = entity_\n                    and attnum > 0\n                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')\n            )\n        )\n        -- Add \"record\" key for insert and update\n        || case\n            when action in ('INSERT', 'UPDATE') then\n                jsonb_build_object(\n                    'record',\n                    (\n                        select\n                            jsonb_object_agg(\n                                -- if unchanged toast, get column name and value from old record\n                                coalesce((c).name, (oc).name),\n                                case\n                                    when (c).name is null then (oc).value\n                                    else (c).value\n                                end\n                            )\n                        from\n                            unnest(columns) c\n                            full outer join unnest(old_columns) oc\n                                on (c).name = (oc).name\n                        where\n                            coalesce((c).is_selectable, (oc).is_selectable)\n                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))\n                    )\n                )\n            else '{}'::jsonb\n        end\n        -- Add \"old_record\" key for update and delete\n        || case\n            when action = 'UPDATE' then\n                jsonb_build_object(\n                        'old_record',\n                        (\n                            select jsonb_object_agg((c).name, (c).value)\n                            from unnest(old_columns) c\n                            where\n                                (c).is_selectable\n                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))\n                        )\n                    )\n            when action = 'DELETE' then\n                jsonb_build_object(\n                    'old_record',\n                    (\n                        select jsonb_object_agg((c).name, (c).value)\n                        from unnest(old_columns) c\n                        where\n                            (c).is_selectable\n                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))\n                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey\n                    )\n                )\n            else '{}'::jsonb\n        end;\n\n        -- Create the prepared statement\n        if is_rls_enabled and action <> 'DELETE' then\n            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then\n                deallocate walrus_rls_stmt;\n            end if;\n            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);\n        end if;\n\n        visible_to_subscription_ids = '{}';\n\n        for subscription_id, claims in (\n                select\n                    subs.subscription_id,\n                    subs.claims\n                from\n                    unnest(subscriptions) subs\n                where\n                    subs.entity = entity_\n                    and subs.claims_role = working_role\n                    and (\n                        realtime.is_visible_through_filters(columns, subs.filters)\n                        or (\n                          action = 'DELETE'\n                          and realtime.is_visible_through_filters(old_columns, subs.filters)\n                        )\n                    )\n        ) loop\n\n            if not is_rls_enabled or action = 'DELETE' then\n                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;\n            else\n                -- Check if RLS allows the role to see the record\n                perform\n                    -- Trim leading and trailing quotes from working_role because set_config\n                    -- doesn't recognize the role as valid if they are included\n                    set_config('role', trim(both '\"' from working_role::text), true),\n                    set_config('request.jwt.claims', claims::text, true);\n\n                execute 'execute walrus_rls_stmt' into subscription_has_access;\n\n                if subscription_has_access then\n                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;\n                end if;\n            end if;\n        end loop;\n\n        perform set_config('role', null, true);\n\n        return next (\n            output,\n            is_rls_enabled,\n            visible_to_subscription_ids,\n            case\n                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']\n                else '{}'\n            end\n        )::realtime.wal_rls;\n\n    end if;\nend loop;\n\nperform set_config('role', null, true);\nend;\n$function$\n"
  },
  {
    "schema": "realtime",
    "function_name": "broadcast_changes",
    "parameters": "topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text",
    "return_type": "void",
    "full_definition": "CREATE OR REPLACE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    -- Declare a variable to hold the JSONB representation of the row\n    row_data jsonb := '{}'::jsonb;\nBEGIN\n    IF level = 'STATEMENT' THEN\n        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';\n    END IF;\n    -- Check the operation type and handle accordingly\n    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN\n        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);\n        PERFORM realtime.send (row_data, event_name, topic_name);\n    ELSE\n        RAISE EXCEPTION 'Unexpected operation type: %', operation;\n    END IF;\nEXCEPTION\n    WHEN OTHERS THEN\n        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;\nEND;\n\n$function$\n"
  },
  {
    "schema": "realtime",
    "function_name": "build_prepared_statement_sql",
    "parameters": "prepared_statement_name text, entity regclass, columns realtime.wal_column[]",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[])\n RETURNS text\n LANGUAGE sql\nAS $function$\n      /*\n      Builds a sql string that, if executed, creates a prepared statement to\n      tests retrive a row from *entity* by its primary key columns.\n      Example\n          select realtime.build_prepared_statement_sql('public.notes', '{\"id\"}'::text[], '{\"bigint\"}'::text[])\n      */\n          select\n      'prepare ' || prepared_statement_name || ' as\n          select\n              exists(\n                  select\n                      1\n                  from\n                      ' || entity || '\n                  where\n                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '\n              )'\n          from\n              unnest(columns) pkc\n          where\n              pkc.is_pkey\n          group by\n              entity\n      $function$\n"
  },
  {
    "schema": "realtime",
    "function_name": "cast",
    "parameters": "val text, type_ regtype",
    "return_type": "jsonb",
    "full_definition": "CREATE OR REPLACE FUNCTION realtime.\"cast\"(val text, type_ regtype)\n RETURNS jsonb\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\ndeclare\n  res jsonb;\nbegin\n  if type_::text = 'bytea' then\n    return to_jsonb(val);\n  end if;\n  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;\n  return res;\nend\n$function$\n"
  },
  {
    "schema": "realtime",
    "function_name": "check_equality_op",
    "parameters": "op realtime.equality_op, type_ regtype, val_1 text, val_2 text",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text)\n RETURNS boolean\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\n      /*\n      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness\n      */\n      declare\n          op_symbol text = (\n              case\n                  when op = 'eq' then '='\n                  when op = 'neq' then '!='\n                  when op = 'lt' then '<'\n                  when op = 'lte' then '<='\n                  when op = 'gt' then '>'\n                  when op = 'gte' then '>='\n                  when op = 'in' then '= any'\n                  else 'UNKNOWN OP'\n              end\n          );\n          res boolean;\n      begin\n          execute format(\n              'select %L::'|| type_::text || ' ' || op_symbol\n              || ' ( %L::'\n              || (\n                  case\n                      when op = 'in' then type_::text || '[]'\n                      else type_::text end\n              )\n              || ')', val_1, val_2) into res;\n          return res;\n      end;\n      $function$\n"
  },
  {
    "schema": "realtime",
    "function_name": "is_visible_through_filters",
    "parameters": "columns realtime.wal_column[], filters realtime.user_defined_filter[]",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[])\n RETURNS boolean\n LANGUAGE sql\n IMMUTABLE\nAS $function$\n    /*\n    Should the record be visible (true) or filtered out (false) after *filters* are applied\n    */\n        select\n            -- Default to allowed when no filters present\n            $2 is null -- no filters. this should not happen because subscriptions has a default\n            or array_length($2, 1) is null -- array length of an empty array is null\n            or bool_and(\n                coalesce(\n                    realtime.check_equality_op(\n                        op:=f.op,\n                        type_:=coalesce(\n                            col.type_oid::regtype, -- null when wal2json version <= 2.4\n                            col.type_name::regtype\n                        ),\n                        -- cast jsonb to text\n                        val_1:=col.value #>> '{}',\n                        val_2:=f.value\n                    ),\n                    false -- if null, filter does not match\n                )\n            )\n        from\n            unnest(filters) f\n            join unnest(columns) col\n                on f.column_name = col.name;\n    $function$\n"
  },
  {
    "schema": "realtime",
    "function_name": "list_changes",
    "parameters": "publication name, slot_name name, max_changes integer, max_record_bytes integer",
    "return_type": "TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)",
    "full_definition": "CREATE OR REPLACE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer)\n RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)\n LANGUAGE sql\n SET log_min_messages TO 'fatal'\nAS $function$\n  WITH pub AS (\n    SELECT\n      concat_ws(\n        ',',\n        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,\n        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,\n        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END\n      ) AS w2j_actions,\n      coalesce(\n        string_agg(\n          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),\n          ','\n        ) filter (WHERE ppt.tablename IS NOT NULL AND ppt.tablename NOT LIKE '% %'),\n        ''\n      ) AS w2j_add_tables\n    FROM pg_publication pp\n    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname\n    WHERE pp.pubname = publication\n    GROUP BY pp.pubname\n    LIMIT 1\n  ),\n  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once\n  w2j AS MATERIALIZED (\n    SELECT x.*, pub.w2j_add_tables\n    FROM pub,\n         pg_logical_slot_get_changes(\n           slot_name, null, max_changes,\n           'include-pk', 'true',\n           'include-transaction', 'false',\n           'include-timestamp', 'true',\n           'include-type-oids', 'true',\n           'format-version', '2',\n           'actions', pub.w2j_actions,\n           'add-tables', pub.w2j_add_tables\n         ) x\n  ),\n  -- Count raw slot entries before apply_rls/subscription filter\n  slot_count AS (\n    SELECT count(*)::bigint AS cnt\n    FROM w2j\n    WHERE w2j.w2j_add_tables <> ''\n  ),\n  -- Apply RLS and filter as before\n  rls_filtered AS (\n    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors\n    FROM w2j,\n         realtime.apply_rls(\n           wal := w2j.data::jsonb,\n           max_record_bytes := max_record_bytes\n         ) xyz(wal, is_rls_enabled, subscription_ids, errors)\n    WHERE w2j.w2j_add_tables <> ''\n      AND xyz.subscription_ids[1] IS NOT NULL\n  )\n  -- Real rows with slot count attached\n  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt\n  FROM rls_filtered rf, slot_count sc\n\n  UNION ALL\n\n  -- Sentinel row: always returned when no real rows exist so Elixir can\n  -- always read slot_changes_count. Identified by wal IS NULL.\n  SELECT null, null, null, null, sc.cnt\n  FROM slot_count sc\n  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)\n$function$\n"
  },
  {
    "schema": "realtime",
    "function_name": "quote_wal2json",
    "parameters": "entity regclass",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION realtime.quote_wal2json(entity regclass)\n RETURNS text\n LANGUAGE sql\n IMMUTABLE STRICT\nAS $function$\n      select\n        (\n          select string_agg('' || ch,'')\n          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)\n          where\n            not (x.idx = 1 and x.ch = '\"')\n            and not (\n              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)\n              and x.ch = '\"'\n            )\n        )\n        || '.'\n        || (\n          select string_agg('' || ch,'')\n          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)\n          where\n            not (x.idx = 1 and x.ch = '\"')\n            and not (\n              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)\n              and x.ch = '\"'\n            )\n          )\n      from\n        pg_class pc\n        join pg_namespace nsp\n          on pc.relnamespace = nsp.oid\n      where\n        pc.oid = entity\n    $function$\n"
  },
  {
    "schema": "realtime",
    "function_name": "send",
    "parameters": "payload jsonb, event text, topic text, private boolean",
    "return_type": "void",
    "full_definition": "CREATE OR REPLACE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n  generated_id uuid;\n  final_payload jsonb;\nBEGIN\n  BEGIN\n    -- Generate a new UUID for the id\n    generated_id := gen_random_uuid();\n\n    -- Check if payload has an 'id' key, if not, add the generated UUID\n    IF payload ? 'id' THEN\n      final_payload := payload;\n    ELSE\n      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));\n    END IF;\n\n    -- Set the topic configuration\n    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);\n\n    -- Attempt to insert the message\n    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)\n    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');\n  EXCEPTION\n    WHEN OTHERS THEN\n      -- Capture and notify the error\n      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;\n  END;\nEND;\n$function$\n"
  },
  {
    "schema": "realtime",
    "function_name": "subscription_check_filters",
    "parameters": "",
    "return_type": "trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION realtime.subscription_check_filters()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\n    /*\n    Validates that the user defined filters for a subscription:\n    - refer to valid columns that the claimed role may access\n    - values are coercable to the correct column type\n    */\n    declare\n        col_names text[] = coalesce(\n                array_agg(c.column_name order by c.ordinal_position),\n                '{}'::text[]\n            )\n            from\n                information_schema.columns c\n            where\n                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity\n                and pg_catalog.has_column_privilege(\n                    (new.claims ->> 'role'),\n                    format('%I.%I', c.table_schema, c.table_name)::regclass,\n                    c.column_name,\n                    'SELECT'\n                );\n        filter realtime.user_defined_filter;\n        col_type regtype;\n\n        in_val jsonb;\n    begin\n        for filter in select * from unnest(new.filters) loop\n            -- Filtered column is valid\n            if not filter.column_name = any(col_names) then\n                raise exception 'invalid column for filter %', filter.column_name;\n            end if;\n\n            -- Type is sanitized and safe for string interpolation\n            col_type = (\n                select atttypid::regtype\n                from pg_catalog.pg_attribute\n                where attrelid = new.entity\n                      and attname = filter.column_name\n            );\n            if col_type is null then\n                raise exception 'failed to lookup type for column %', filter.column_name;\n            end if;\n\n            -- Set maximum number of entries for in filter\n            if filter.op = 'in'::realtime.equality_op then\n                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);\n                if coalesce(jsonb_array_length(in_val), 0) > 100 then\n                    raise exception 'too many values for `in` filter. Maximum 100';\n                end if;\n            else\n                -- raises an exception if value is not coercable to type\n                perform realtime.cast(filter.value, col_type);\n            end if;\n\n        end loop;\n\n        -- Apply consistent order to filters so the unique constraint on\n        -- (subscription_id, entity, filters) can't be tricked by a different filter order\n        new.filters = coalesce(\n            array_agg(f order by f.column_name, f.op, f.value),\n            '{}'\n        ) from unnest(new.filters) f;\n\n        return new;\n    end;\n    $function$\n"
  },
  {
    "schema": "realtime",
    "function_name": "to_regrole",
    "parameters": "role_name text",
    "return_type": "regrole",
    "full_definition": "CREATE OR REPLACE FUNCTION realtime.to_regrole(role_name text)\n RETURNS regrole\n LANGUAGE sql\n IMMUTABLE\nAS $function$ select role_name::regrole $function$\n"
  },
  {
    "schema": "realtime",
    "function_name": "topic",
    "parameters": "",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION realtime.topic()\n RETURNS text\n LANGUAGE sql\n STABLE\nAS $function$\nselect nullif(current_setting('realtime.topic', true), '')::text;\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "allow_any_operation",
    "parameters": "expected_operations text[]",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.allow_any_operation(expected_operations text[])\n RETURNS boolean\n LANGUAGE sql\n STABLE\nAS $function$\n  WITH current_operation AS (\n    SELECT storage.operation() AS raw_operation\n  ),\n  normalized AS (\n    SELECT CASE\n      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)\n      ELSE raw_operation\n    END AS current_operation\n    FROM current_operation\n  )\n  SELECT EXISTS (\n    SELECT 1\n    FROM normalized n\n    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation\n    WHERE expected_operation IS NOT NULL\n      AND expected_operation <> ''\n      AND n.current_operation = CASE\n        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)\n        ELSE expected_operation\n      END\n  );\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "allow_only_operation",
    "parameters": "expected_operation text",
    "return_type": "boolean",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.allow_only_operation(expected_operation text)\n RETURNS boolean\n LANGUAGE sql\n STABLE\nAS $function$\n  WITH current_operation AS (\n    SELECT storage.operation() AS raw_operation\n  ),\n  normalized AS (\n    SELECT\n      CASE\n        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)\n        ELSE raw_operation\n      END AS current_operation,\n      CASE\n        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)\n        ELSE expected_operation\n      END AS requested_operation\n    FROM current_operation\n  )\n  SELECT CASE\n    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE\n    ELSE COALESCE(current_operation = requested_operation, FALSE)\n  END\n  FROM normalized;\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "can_insert_object",
    "parameters": "bucketid text, name text, owner uuid, metadata jsonb",
    "return_type": "void",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  INSERT INTO \"storage\".\"objects\" (\"bucket_id\", \"name\", \"owner\", \"metadata\") VALUES (bucketid, name, owner, metadata);\n  -- hack to rollback the successful insert\n  RAISE sqlstate 'PT200' using\n  message = 'ROLLBACK',\n  detail = 'rollback successful insert';\nEND\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "enforce_bucket_name_length",
    "parameters": "",
    "return_type": "trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.enforce_bucket_name_length()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n    if length(new.name) > 100 then\n        raise exception 'bucket name \"%\" is too long (% characters). Max is 100.', new.name, length(new.name);\n    end if;\n    return new;\nend;\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "extension",
    "parameters": "name text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.extension(name text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n_parts text[];\n_filename text;\nBEGIN\n\tselect string_to_array(name, '/') into _parts;\n\tselect _parts[array_length(_parts,1)] into _filename;\n\t-- @todo return the last part instead of 2\n\treturn reverse(split_part(reverse(_filename), '.', 1));\nEND\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "filename",
    "parameters": "name text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.filename(name text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n_parts text[];\nBEGIN\n\tselect string_to_array(name, '/') into _parts;\n\treturn _parts[array_length(_parts,1)];\nEND\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "foldername",
    "parameters": "name text",
    "return_type": "text[]",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.foldername(name text)\n RETURNS text[]\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n_parts text[];\nBEGIN\n\tselect string_to_array(name, '/') into _parts;\n\treturn _parts[1:array_length(_parts,1)-1];\nEND\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "get_common_prefix",
    "parameters": "p_key text, p_prefix text, p_delimiter text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text)\n RETURNS text\n LANGUAGE sql\n IMMUTABLE\nAS $function$\nSELECT CASE\n    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0\n    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))\n    ELSE NULL\nEND;\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "get_size_by_bucket",
    "parameters": "",
    "return_type": "TABLE(size bigint, bucket_id text)",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.get_size_by_bucket()\n RETURNS TABLE(size bigint, bucket_id text)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    return query\n        select sum((metadata->>'size')::int) as size, obj.bucket_id\n        from \"storage\".objects as obj\n        group by obj.bucket_id;\nEND\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "list_multipart_uploads_with_delimiter",
    "parameters": "bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text",
    "return_type": "TABLE(key text, id text, created_at timestamp with time zone)",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text)\n RETURNS TABLE(key text, id text, created_at timestamp with time zone)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    RETURN QUERY EXECUTE\n        'SELECT DISTINCT ON(key COLLATE \"C\") * from (\n            SELECT\n                CASE\n                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN\n                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))\n                    ELSE\n                        key\n                END AS key, id, created_at\n            FROM\n                storage.s3_multipart_uploads\n            WHERE\n                bucket_id = $5 AND\n                key ILIKE $1 || ''%'' AND\n                CASE\n                    WHEN $4 != '''' AND $6 = '''' THEN\n                        CASE\n                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN\n                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE \"C\" > $4\n                            ELSE\n                                key COLLATE \"C\" > $4\n                            END\n                    ELSE\n                        true\n                END AND\n                CASE\n                    WHEN $6 != '''' THEN\n                        id COLLATE \"C\" > $6\n                    ELSE\n                        true\n                    END\n            ORDER BY\n                key COLLATE \"C\" ASC, created_at ASC) as e order by key COLLATE \"C\" LIMIT $3'\n        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;\nEND;\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "list_objects_with_delimiter",
    "parameters": "_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text",
    "return_type": "TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text)\n RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)\n LANGUAGE plpgsql\n STABLE\nAS $function$\nDECLARE\n    v_peek_name TEXT;\n    v_current RECORD;\n    v_common_prefix TEXT;\n\n    -- Configuration\n    v_is_asc BOOLEAN;\n    v_prefix TEXT;\n    v_start TEXT;\n    v_upper_bound TEXT;\n    v_file_batch_size INT;\n\n    -- Seek state\n    v_next_seek TEXT;\n    v_count INT := 0;\n\n    -- Dynamic SQL for batch query only\n    v_batch_query TEXT;\n\nBEGIN\n    -- ========================================================================\n    -- INITIALIZATION\n    -- ========================================================================\n    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';\n    v_prefix := coalesce(prefix_param, '');\n    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;\n    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);\n\n    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE \"C\")\n    IF v_prefix = '' THEN\n        v_upper_bound := NULL;\n    ELSIF right(v_prefix, 1) = delimiter_param THEN\n        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);\n    ELSE\n        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);\n    END IF;\n\n    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)\n    IF v_is_asc THEN\n        IF v_upper_bound IS NOT NULL THEN\n            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||\n                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE \"C\" >= $2 ' ||\n                'AND o.name COLLATE \"C\" < $3 ORDER BY o.name COLLATE \"C\" ASC LIMIT $4';\n        ELSE\n            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||\n                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE \"C\" >= $2 ' ||\n                'ORDER BY o.name COLLATE \"C\" ASC LIMIT $4';\n        END IF;\n    ELSE\n        IF v_upper_bound IS NOT NULL THEN\n            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||\n                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE \"C\" < $2 ' ||\n                'AND o.name COLLATE \"C\" >= $3 ORDER BY o.name COLLATE \"C\" DESC LIMIT $4';\n        ELSE\n            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||\n                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE \"C\" < $2 ' ||\n                'ORDER BY o.name COLLATE \"C\" DESC LIMIT $4';\n        END IF;\n    END IF;\n\n    -- ========================================================================\n    -- SEEK INITIALIZATION: Determine starting position\n    -- ========================================================================\n    IF v_start = '' THEN\n        IF v_is_asc THEN\n            v_next_seek := v_prefix;\n        ELSE\n            -- DESC without cursor: find the last item in range\n            IF v_upper_bound IS NOT NULL THEN\n                SELECT o.name INTO v_next_seek FROM storage.objects o\n                WHERE o.bucket_id = _bucket_id AND o.name COLLATE \"C\" >= v_prefix AND o.name COLLATE \"C\" < v_upper_bound\n                ORDER BY o.name COLLATE \"C\" DESC LIMIT 1;\n            ELSIF v_prefix <> '' THEN\n                SELECT o.name INTO v_next_seek FROM storage.objects o\n                WHERE o.bucket_id = _bucket_id AND o.name COLLATE \"C\" >= v_prefix\n                ORDER BY o.name COLLATE \"C\" DESC LIMIT 1;\n            ELSE\n                SELECT o.name INTO v_next_seek FROM storage.objects o\n                WHERE o.bucket_id = _bucket_id\n                ORDER BY o.name COLLATE \"C\" DESC LIMIT 1;\n            END IF;\n\n            IF v_next_seek IS NOT NULL THEN\n                v_next_seek := v_next_seek || delimiter_param;\n            ELSE\n                RETURN;\n            END IF;\n        END IF;\n    ELSE\n        -- Cursor provided: determine if it refers to a folder or leaf\n        IF EXISTS (\n            SELECT 1 FROM storage.objects o\n            WHERE o.bucket_id = _bucket_id\n              AND o.name COLLATE \"C\" LIKE v_start || delimiter_param || '%'\n            LIMIT 1\n        ) THEN\n            -- Cursor refers to a folder\n            IF v_is_asc THEN\n                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);\n            ELSE\n                v_next_seek := v_start || delimiter_param;\n            END IF;\n        ELSE\n            -- Cursor refers to a leaf object\n            IF v_is_asc THEN\n                v_next_seek := v_start || delimiter_param;\n            ELSE\n                v_next_seek := v_start;\n            END IF;\n        END IF;\n    END IF;\n\n    -- ========================================================================\n    -- MAIN LOOP: Hybrid peek-then-batch algorithm\n    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch\n    -- ========================================================================\n    LOOP\n        EXIT WHEN v_count >= max_keys;\n\n        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)\n        IF v_is_asc THEN\n            IF v_upper_bound IS NOT NULL THEN\n                SELECT o.name INTO v_peek_name FROM storage.objects o\n                WHERE o.bucket_id = _bucket_id AND o.name COLLATE \"C\" >= v_next_seek AND o.name COLLATE \"C\" < v_upper_bound\n                ORDER BY o.name COLLATE \"C\" ASC LIMIT 1;\n            ELSE\n                SELECT o.name INTO v_peek_name FROM storage.objects o\n                WHERE o.bucket_id = _bucket_id AND o.name COLLATE \"C\" >= v_next_seek\n                ORDER BY o.name COLLATE \"C\" ASC LIMIT 1;\n            END IF;\n        ELSE\n            IF v_upper_bound IS NOT NULL THEN\n                SELECT o.name INTO v_peek_name FROM storage.objects o\n                WHERE o.bucket_id = _bucket_id AND o.name COLLATE \"C\" < v_next_seek AND o.name COLLATE \"C\" >= v_prefix\n                ORDER BY o.name COLLATE \"C\" DESC LIMIT 1;\n            ELSIF v_prefix <> '' THEN\n                SELECT o.name INTO v_peek_name FROM storage.objects o\n                WHERE o.bucket_id = _bucket_id AND o.name COLLATE \"C\" < v_next_seek AND o.name COLLATE \"C\" >= v_prefix\n                ORDER BY o.name COLLATE \"C\" DESC LIMIT 1;\n            ELSE\n                SELECT o.name INTO v_peek_name FROM storage.objects o\n                WHERE o.bucket_id = _bucket_id AND o.name COLLATE \"C\" < v_next_seek\n                ORDER BY o.name COLLATE \"C\" DESC LIMIT 1;\n            END IF;\n        END IF;\n\n        EXIT WHEN v_peek_name IS NULL;\n\n        -- STEP 2: Check if this is a FOLDER or FILE\n        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);\n\n        IF v_common_prefix IS NOT NULL THEN\n            -- FOLDER: Emit and skip to next folder (no heap access needed)\n            name := rtrim(v_common_prefix, delimiter_param);\n            id := NULL;\n            updated_at := NULL;\n            created_at := NULL;\n            last_accessed_at := NULL;\n            metadata := NULL;\n            RETURN NEXT;\n            v_count := v_count + 1;\n\n            -- Advance seek past the folder range\n            IF v_is_asc THEN\n                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);\n            ELSE\n                v_next_seek := v_common_prefix;\n            END IF;\n        ELSE\n            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)\n            -- For ASC: upper_bound is the exclusive upper limit (< condition)\n            -- For DESC: prefix is the inclusive lower limit (>= condition)\n            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,\n                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size\n            LOOP\n                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);\n\n                IF v_common_prefix IS NOT NULL THEN\n                    -- Hit a folder: exit batch, let peek handle it\n                    v_next_seek := v_current.name;\n                    EXIT;\n                END IF;\n\n                -- Emit file\n                name := v_current.name;\n                id := v_current.id;\n                updated_at := v_current.updated_at;\n                created_at := v_current.created_at;\n                last_accessed_at := v_current.last_accessed_at;\n                metadata := v_current.metadata;\n                RETURN NEXT;\n                v_count := v_count + 1;\n\n                -- Advance seek past this file\n                IF v_is_asc THEN\n                    v_next_seek := v_current.name || delimiter_param;\n                ELSE\n                    v_next_seek := v_current.name;\n                END IF;\n\n                EXIT WHEN v_count >= max_keys;\n            END LOOP;\n        END IF;\n    END LOOP;\nEND;\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "operation",
    "parameters": "",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.operation()\n RETURNS text\n LANGUAGE plpgsql\n STABLE\nAS $function$\nBEGIN\n    RETURN current_setting('storage.operation', true);\nEND;\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "protect_delete",
    "parameters": "",
    "return_type": "trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.protect_delete()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    -- Check if storage.allow_delete_query is set to 'true'\n    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN\n        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'\n            USING HINT = 'This prevents accidental data loss from orphaned objects.',\n                  ERRCODE = '42501';\n    END IF;\n    RETURN NULL;\nEND;\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "search",
    "parameters": "prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text",
    "return_type": "TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)\n RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)\n LANGUAGE plpgsql\n STABLE\nAS $function$\nDECLARE\n    v_peek_name TEXT;\n    v_current RECORD;\n    v_common_prefix TEXT;\n    v_delimiter CONSTANT TEXT := '/';\n\n    -- Configuration\n    v_limit INT;\n    v_prefix TEXT;\n    v_prefix_lower TEXT;\n    v_is_asc BOOLEAN;\n    v_order_by TEXT;\n    v_sort_order TEXT;\n    v_upper_bound TEXT;\n    v_file_batch_size INT;\n\n    -- Dynamic SQL for batch query only\n    v_batch_query TEXT;\n\n    -- Seek state\n    v_next_seek TEXT;\n    v_count INT := 0;\n    v_skipped INT := 0;\nBEGIN\n    -- ========================================================================\n    -- INITIALIZATION\n    -- ========================================================================\n    v_limit := LEAST(coalesce(limits, 100), 1500);\n    v_prefix := coalesce(prefix, '') || coalesce(search, '');\n    v_prefix_lower := lower(v_prefix);\n    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';\n    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);\n\n    -- Validate sort column\n    CASE lower(coalesce(sortcolumn, 'name'))\n        WHEN 'name' THEN v_order_by := 'name';\n        WHEN 'updated_at' THEN v_order_by := 'updated_at';\n        WHEN 'created_at' THEN v_order_by := 'created_at';\n        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';\n        ELSE v_order_by := 'name';\n    END CASE;\n\n    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;\n\n    -- ========================================================================\n    -- NON-NAME SORTING: Use path_tokens approach (unchanged)\n    -- ========================================================================\n    IF v_order_by != 'name' THEN\n        RETURN QUERY EXECUTE format(\n            $sql$\n            WITH folders AS (\n                SELECT path_tokens[$1] AS folder\n                FROM storage.objects\n                WHERE objects.name ILIKE $2 || '%%'\n                  AND bucket_id = $3\n                  AND array_length(objects.path_tokens, 1) <> $1\n                GROUP BY folder\n                ORDER BY folder %s\n            )\n            (SELECT folder AS \"name\",\n                   NULL::uuid AS id,\n                   NULL::timestamptz AS updated_at,\n                   NULL::timestamptz AS created_at,\n                   NULL::timestamptz AS last_accessed_at,\n                   NULL::jsonb AS metadata FROM folders)\n            UNION ALL\n            (SELECT path_tokens[$1] AS \"name\",\n                   id, updated_at, created_at, last_accessed_at, metadata\n             FROM storage.objects\n             WHERE objects.name ILIKE $2 || '%%'\n               AND bucket_id = $3\n               AND array_length(objects.path_tokens, 1) = $1\n             ORDER BY %I %s)\n            LIMIT $4 OFFSET $5\n            $sql$, v_sort_order, v_order_by, v_sort_order\n        ) USING levels, v_prefix, bucketname, v_limit, offsets;\n        RETURN;\n    END IF;\n\n    -- ========================================================================\n    -- NAME SORTING: Hybrid skip-scan with batch optimization\n    -- ========================================================================\n\n    -- Calculate upper bound for prefix filtering\n    IF v_prefix_lower = '' THEN\n        v_upper_bound := NULL;\n    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN\n        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);\n    ELSE\n        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);\n    END IF;\n\n    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)\n    IF v_is_asc THEN\n        IF v_upper_bound IS NOT NULL THEN\n            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||\n                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE \"C\" >= $2 ' ||\n                'AND lower(o.name) COLLATE \"C\" < $3 ORDER BY lower(o.name) COLLATE \"C\" ASC LIMIT $4';\n        ELSE\n            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||\n                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE \"C\" >= $2 ' ||\n                'ORDER BY lower(o.name) COLLATE \"C\" ASC LIMIT $4';\n        END IF;\n    ELSE\n        IF v_upper_bound IS NOT NULL THEN\n            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||\n                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE \"C\" < $2 ' ||\n                'AND lower(o.name) COLLATE \"C\" >= $3 ORDER BY lower(o.name) COLLATE \"C\" DESC LIMIT $4';\n        ELSE\n            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||\n                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE \"C\" < $2 ' ||\n                'ORDER BY lower(o.name) COLLATE \"C\" DESC LIMIT $4';\n        END IF;\n    END IF;\n\n    -- Initialize seek position\n    IF v_is_asc THEN\n        v_next_seek := v_prefix_lower;\n    ELSE\n        -- DESC: find the last item in range first (static SQL)\n        IF v_upper_bound IS NOT NULL THEN\n            SELECT o.name INTO v_peek_name FROM storage.objects o\n            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE \"C\" >= v_prefix_lower AND lower(o.name) COLLATE \"C\" < v_upper_bound\n            ORDER BY lower(o.name) COLLATE \"C\" DESC LIMIT 1;\n        ELSIF v_prefix_lower <> '' THEN\n            SELECT o.name INTO v_peek_name FROM storage.objects o\n            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE \"C\" >= v_prefix_lower\n            ORDER BY lower(o.name) COLLATE \"C\" DESC LIMIT 1;\n        ELSE\n            SELECT o.name INTO v_peek_name FROM storage.objects o\n            WHERE o.bucket_id = bucketname\n            ORDER BY lower(o.name) COLLATE \"C\" DESC LIMIT 1;\n        END IF;\n\n        IF v_peek_name IS NOT NULL THEN\n            v_next_seek := lower(v_peek_name) || v_delimiter;\n        ELSE\n            RETURN;\n        END IF;\n    END IF;\n\n    -- ========================================================================\n    -- MAIN LOOP: Hybrid peek-then-batch algorithm\n    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch\n    -- ========================================================================\n    LOOP\n        EXIT WHEN v_count >= v_limit;\n\n        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)\n        IF v_is_asc THEN\n            IF v_upper_bound IS NOT NULL THEN\n                SELECT o.name INTO v_peek_name FROM storage.objects o\n                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE \"C\" >= v_next_seek AND lower(o.name) COLLATE \"C\" < v_upper_bound\n                ORDER BY lower(o.name) COLLATE \"C\" ASC LIMIT 1;\n            ELSE\n                SELECT o.name INTO v_peek_name FROM storage.objects o\n                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE \"C\" >= v_next_seek\n                ORDER BY lower(o.name) COLLATE \"C\" ASC LIMIT 1;\n            END IF;\n        ELSE\n            IF v_upper_bound IS NOT NULL THEN\n                SELECT o.name INTO v_peek_name FROM storage.objects o\n                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE \"C\" < v_next_seek AND lower(o.name) COLLATE \"C\" >= v_prefix_lower\n                ORDER BY lower(o.name) COLLATE \"C\" DESC LIMIT 1;\n            ELSIF v_prefix_lower <> '' THEN\n                SELECT o.name INTO v_peek_name FROM storage.objects o\n                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE \"C\" < v_next_seek AND lower(o.name) COLLATE \"C\" >= v_prefix_lower\n                ORDER BY lower(o.name) COLLATE \"C\" DESC LIMIT 1;\n            ELSE\n                SELECT o.name INTO v_peek_name FROM storage.objects o\n                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE \"C\" < v_next_seek\n                ORDER BY lower(o.name) COLLATE \"C\" DESC LIMIT 1;\n            END IF;\n        END IF;\n\n        EXIT WHEN v_peek_name IS NULL;\n\n        -- STEP 2: Check if this is a FOLDER or FILE\n        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);\n\n        IF v_common_prefix IS NOT NULL THEN\n            -- FOLDER: Handle offset, emit if needed, skip to next folder\n            IF v_skipped < offsets THEN\n                v_skipped := v_skipped + 1;\n            ELSE\n                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);\n                id := NULL;\n                updated_at := NULL;\n                created_at := NULL;\n                last_accessed_at := NULL;\n                metadata := NULL;\n                RETURN NEXT;\n                v_count := v_count + 1;\n            END IF;\n\n            -- Advance seek past the folder range\n            IF v_is_asc THEN\n                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);\n            ELSE\n                v_next_seek := lower(v_common_prefix);\n            END IF;\n        ELSE\n            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)\n            -- For ASC: upper_bound is the exclusive upper limit (< condition)\n            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)\n            FOR v_current IN EXECUTE v_batch_query\n                USING bucketname, v_next_seek,\n                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size\n            LOOP\n                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);\n\n                IF v_common_prefix IS NOT NULL THEN\n                    -- Hit a folder: exit batch, let peek handle it\n                    v_next_seek := lower(v_current.name);\n                    EXIT;\n                END IF;\n\n                -- Handle offset skipping\n                IF v_skipped < offsets THEN\n                    v_skipped := v_skipped + 1;\n                ELSE\n                    -- Emit file\n                    name := split_part(v_current.name, v_delimiter, levels);\n                    id := v_current.id;\n                    updated_at := v_current.updated_at;\n                    created_at := v_current.created_at;\n                    last_accessed_at := v_current.last_accessed_at;\n                    metadata := v_current.metadata;\n                    RETURN NEXT;\n                    v_count := v_count + 1;\n                END IF;\n\n                -- Advance seek past this file\n                IF v_is_asc THEN\n                    v_next_seek := lower(v_current.name) || v_delimiter;\n                ELSE\n                    v_next_seek := lower(v_current.name);\n                END IF;\n\n                EXIT WHEN v_count >= v_limit;\n            END LOOP;\n        END IF;\n    END LOOP;\nEND;\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "search_by_timestamp",
    "parameters": "p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text",
    "return_type": "TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text)\n RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)\n LANGUAGE plpgsql\n STABLE\nAS $function$\nDECLARE\n    v_cursor_op text;\n    v_query text;\n    v_prefix text;\nBEGIN\n    v_prefix := coalesce(p_prefix, '');\n\n    IF p_sort_order = 'asc' THEN\n        v_cursor_op := '>';\n    ELSE\n        v_cursor_op := '<';\n    END IF;\n\n    v_query := format($sql$\n        WITH raw_objects AS (\n            SELECT\n                o.name AS obj_name,\n                o.id AS obj_id,\n                o.updated_at AS obj_updated_at,\n                o.created_at AS obj_created_at,\n                o.last_accessed_at AS obj_last_accessed_at,\n                o.metadata AS obj_metadata,\n                storage.get_common_prefix(o.name, $1, '/') AS common_prefix\n            FROM storage.objects o\n            WHERE o.bucket_id = $2\n              AND o.name COLLATE \"C\" LIKE $1 || '%%'\n        ),\n        -- Aggregate common prefixes (folders)\n        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior\n        aggregated_prefixes AS (\n            SELECT\n                rtrim(common_prefix, '/') AS name,\n                NULL::uuid AS id,\n                MIN(obj_created_at) AS updated_at,\n                MIN(obj_created_at) AS created_at,\n                NULL::timestamptz AS last_accessed_at,\n                NULL::jsonb AS metadata,\n                TRUE AS is_prefix\n            FROM raw_objects\n            WHERE common_prefix IS NOT NULL\n            GROUP BY common_prefix\n        ),\n        leaf_objects AS (\n            SELECT\n                obj_name AS name,\n                obj_id AS id,\n                obj_updated_at AS updated_at,\n                obj_created_at AS created_at,\n                obj_last_accessed_at AS last_accessed_at,\n                obj_metadata AS metadata,\n                FALSE AS is_prefix\n            FROM raw_objects\n            WHERE common_prefix IS NULL\n        ),\n        combined AS (\n            SELECT * FROM aggregated_prefixes\n            UNION ALL\n            SELECT * FROM leaf_objects\n        ),\n        filtered AS (\n            SELECT *\n            FROM combined\n            WHERE (\n                $5 = ''\n                OR ROW(\n                    date_trunc('milliseconds', %I),\n                    name COLLATE \"C\"\n                ) %s ROW(\n                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),\n                    $5\n                )\n            )\n        )\n        SELECT\n            split_part(name, '/', $3) AS key,\n            name,\n            id,\n            updated_at,\n            created_at,\n            last_accessed_at,\n            metadata\n        FROM filtered\n        ORDER BY\n            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,\n            name COLLATE \"C\" %s\n        LIMIT $4\n    $sql$,\n        p_sort_column,\n        v_cursor_op,\n        p_sort_column,\n        p_sort_order,\n        p_sort_order\n    );\n\n    RETURN QUERY EXECUTE v_query\n    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;\nEND;\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "search_v2",
    "parameters": "prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text",
    "return_type": "TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text)\n RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)\n LANGUAGE plpgsql\n STABLE\nAS $function$\nDECLARE\n    v_sort_col text;\n    v_sort_ord text;\n    v_limit int;\nBEGIN\n    -- Cap limit to maximum of 1500 records\n    v_limit := LEAST(coalesce(limits, 100), 1500);\n\n    -- Validate and normalize sort_order\n    v_sort_ord := lower(coalesce(sort_order, 'asc'));\n    IF v_sort_ord NOT IN ('asc', 'desc') THEN\n        v_sort_ord := 'asc';\n    END IF;\n\n    -- Validate and normalize sort_column\n    v_sort_col := lower(coalesce(sort_column, 'name'));\n    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN\n        v_sort_col := 'name';\n    END IF;\n\n    -- Route to appropriate implementation\n    IF v_sort_col = 'name' THEN\n        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))\n        RETURN QUERY\n        SELECT\n            split_part(l.name, '/', levels) AS key,\n            l.name AS name,\n            l.id,\n            l.updated_at,\n            l.created_at,\n            l.last_accessed_at,\n            l.metadata\n        FROM storage.list_objects_with_delimiter(\n            bucket_name,\n            coalesce(prefix, ''),\n            '/',\n            v_limit,\n            start_after,\n            '',\n            v_sort_ord\n        ) l;\n    ELSE\n        -- Use aggregation approach for timestamp sorting\n        -- Not efficient for large datasets but supports correct pagination\n        RETURN QUERY SELECT * FROM storage.search_by_timestamp(\n            prefix, bucket_name, v_limit, levels, start_after,\n            v_sort_ord, v_sort_col, sort_column_after\n        );\n    END IF;\nEND;\n$function$\n"
  },
  {
    "schema": "storage",
    "function_name": "update_updated_at_column",
    "parameters": "",
    "return_type": "trigger",
    "full_definition": "CREATE OR REPLACE FUNCTION storage.update_updated_at_column()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    NEW.updated_at = now();\n    RETURN NEW; \nEND;\n$function$\n"
  },
  {
    "schema": "vault",
    "function_name": "_crypto_aead_det_decrypt",
    "parameters": "message bytea, additional bytea, key_id bigint, context bytea, nonce bytea",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE\nAS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_decrypt_by_id$function$\n"
  },
  {
    "schema": "vault",
    "function_name": "_crypto_aead_det_encrypt",
    "parameters": "message bytea, additional bytea, key_id bigint, context bytea, nonce bytea",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION vault._crypto_aead_det_encrypt(message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE\nAS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_encrypt_by_id$function$\n"
  },
  {
    "schema": "vault",
    "function_name": "_crypto_aead_det_noncegen",
    "parameters": "",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION vault._crypto_aead_det_noncegen()\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE\nAS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_noncegen$function$\n"
  },
  {
    "schema": "vault",
    "function_name": "create_secret",
    "parameters": "new_secret text, new_name text, new_description text, new_key_id uuid",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION vault.create_secret(new_secret text, new_name text DEFAULT NULL::text, new_description text DEFAULT ''::text, new_key_id uuid DEFAULT NULL::uuid)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\nDECLARE\n  rec record;\nBEGIN\n  INSERT INTO vault.secrets (secret, name, description)\n  VALUES (\n    new_secret,\n    new_name,\n    new_description\n  )\n  RETURNING * INTO rec;\n  UPDATE vault.secrets s\n  SET secret = encode(vault._crypto_aead_det_encrypt(\n    message := convert_to(rec.secret, 'utf8'),\n    additional := convert_to(s.id::text, 'utf8'),\n    key_id := 0,\n    context := 'pgsodium'::bytea,\n    nonce := rec.nonce\n  ), 'base64')\n  WHERE id = rec.id;\n  RETURN rec.id;\nEND\n$function$\n"
  },
  {
    "schema": "vault",
    "function_name": "update_secret",
    "parameters": "secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid",
    "return_type": "void",
    "full_definition": "CREATE OR REPLACE FUNCTION vault.update_secret(secret_id uuid, new_secret text DEFAULT NULL::text, new_name text DEFAULT NULL::text, new_description text DEFAULT NULL::text, new_key_id uuid DEFAULT NULL::uuid)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\nDECLARE\n  decrypted_secret text := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = secret_id);\nBEGIN\n  UPDATE vault.secrets s\n  SET\n    secret = CASE WHEN new_secret IS NULL THEN s.secret\n                  ELSE encode(vault._crypto_aead_det_encrypt(\n                    message := convert_to(new_secret, 'utf8'),\n                    additional := convert_to(s.id::text, 'utf8'),\n                    key_id := 0,\n                    context := 'pgsodium'::bytea,\n                    nonce := s.nonce\n                  ), 'base64') END,\n    name = coalesce(new_name, s.name),\n    description = coalesce(new_description, s.description),\n    updated_at = now()\n  WHERE s.id = secret_id;\nEND\n$function$\n"
  }
]