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
    "parameters": "text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.gen_salt(text)\n RETURNS text\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_gen_salt$function$\n"
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
    "parameters": "bytea, bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.hmac(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_hmac$function$\n"
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
    "parameters": "bytea, bytea",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$\n"
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
    "function_name": "pgp_pub_decrypt_bytea",
    "parameters": "bytea, bytea, text, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$\n"
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
    "parameters": "bytea, bytea",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$\n"
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
    "function_name": "pgp_sym_decrypt",
    "parameters": "bytea, text",
    "return_type": "text",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$\n"
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
    "function_name": "pgp_sym_decrypt_bytea",
    "parameters": "bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$\n"
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
    "function_name": "pgp_sym_encrypt",
    "parameters": "text, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$\n"
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
    "function_name": "pgp_sym_encrypt_bytea",
    "parameters": "bytea, text",
    "return_type": "bytea",
    "full_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$\n"
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
  }
]