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
    "function_name": "apply_inventory_delta",
    "parameters": "p_part_id uuid, p_branch_id uuid, p_delta numeric, p_reason text, p_movement_type text, p_reference_table text, p_reference_id uuid, p_metadata jsonb",
    "return_type": "void",
    "full_definition": "CREATE OR REPLACE FUNCTION public.apply_inventory_delta(p_part_id uuid, p_branch_id uuid, p_delta numeric, p_reason text, p_movement_type text, p_reference_table text, p_reference_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_inventory public.inventory%rowtype;\r\n  v_before numeric(12,3);\r\n  v_after numeric(12,3);\r\nbegin\r\n  if p_delta = 0 then\r\n    return;\r\n  end if;\r\n\r\n  select *\r\n  into v_inventory\r\n  from public.inventory i\r\n  where i.part_id = p_part_id\r\n    and i.branch_id = p_branch_id\r\n  for update;\r\n\r\n  if not found then\r\n    if p_delta < 0 then\r\n      raise exception 'No existe inventario para descontar en la sucursal %', p_branch_id;\r\n    end if;\r\n\r\n    insert into public.inventory (\r\n      part_id,\r\n      branch_id,\r\n      quantity,\r\n      min_quantity,\r\n      last_restock\r\n    )\r\n    values (\r\n      p_part_id,\r\n      p_branch_id,\r\n      0,\r\n      0,\r\n      case when p_delta > 0 then now() else null end\r\n    )\r\n    returning * into v_inventory;\r\n  end if;\r\n\r\n  v_before := coalesce(v_inventory.quantity, 0);\r\n  v_after := v_before + p_delta;\r\n\r\n  if v_after < 0 then\r\n    raise exception 'Stock insuficiente para el producto % en la sucursal %', p_part_id, p_branch_id;\r\n  end if;\r\n\r\n  update public.inventory\r\n  set\r\n    quantity = v_after,\r\n    last_restock = case when p_delta > 0 then now() else last_restock end,\r\n    updated_at = now()\r\n  where id = v_inventory.id;\r\n\r\n  insert into public.inventory_movement_history (\r\n    branch_id,\r\n    part_id,\r\n    movement_type,\r\n    quantity,\r\n    quantity_before,\r\n    quantity_after,\r\n    reason,\r\n    reference_table,\r\n    reference_id,\r\n    created_by,\r\n    metadata\r\n  )\r\n  values (\r\n    p_branch_id,\r\n    p_part_id,\r\n    p_movement_type,\r\n    abs(p_delta),\r\n    v_before,\r\n    v_after,\r\n    coalesce(nullif(trim(p_reason), ''), 'Movimiento de inventario'),\r\n    p_reference_table,\r\n    p_reference_id,\r\n    auth.uid(),\r\n    coalesce(p_metadata, '{}'::jsonb)\r\n  );\r\nend;\r\n$function$\n"
  },
  {
    "schema": "public",
    "function_name": "apply_inventory_transfer_resolution",
    "parameters": "p_transfer_id uuid, p_action text, p_reason text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.apply_inventory_transfer_resolution(p_transfer_id uuid, p_action text, p_reason text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_transfer public.inventory_transfer_requests%rowtype;\r\n  v_item record;\r\n  v_action text;\r\n  v_reason text;\r\n  v_status text;\r\n  v_destination_part_id uuid;\r\nbegin\r\n  if not public.inventory_has_management_access() then\r\n    raise exception 'Only admin or manager can apply transfer actions';\r\n  end if;\r\n\r\n  v_action := lower(coalesce(trim(p_action), ''));\r\n  if v_action not in ('anulacion', 'devolucion', 'reposicion') then\r\n    raise exception 'Invalid action. Use anulacion, devolucion or reposicion';\r\n  end if;\r\n\r\n  select *\r\n  into v_transfer\r\n  from public.inventory_transfer_requests r\r\n  where r.id = p_transfer_id\r\n  for update;\r\n\r\n  if not found then\r\n    raise exception 'Transfer not found';\r\n  end if;\r\n\r\n  if v_transfer.status in ('anulled', 'returned', 'replenished') then\r\n    raise exception 'Transfer already resolved with status %', v_transfer.status;\r\n  end if;\r\n\r\n  if v_action in ('devolucion', 'reposicion') and v_transfer.status <> 'completed' then\r\n    raise exception 'Action % requires transfer status completed', v_action;\r\n  end if;\r\n\r\n  if not public.inventory_is_admin()\r\n     and v_transfer.from_branch_id <> public.current_user_branch_id()\r\n     and v_transfer.to_branch_id <> public.current_user_branch_id() then\r\n    raise exception 'No permission for this transfer';\r\n  end if;\r\n\r\n  v_reason := coalesce(nullif(trim(p_reason), ''), 'Accion aplicada sobre traspaso');\r\n\r\n  if v_action = 'devolucion' then\r\n    for v_item in\r\n      select i.id, i.part_id, i.quantity, i.destination_part_id\r\n      from public.inventory_transfer_request_items i\r\n      where i.transfer_id = p_transfer_id\r\n    loop\r\n      v_destination_part_id := coalesce(\r\n        v_item.destination_part_id,\r\n        public.ensure_transfer_destination_part(\r\n          v_item.part_id,\r\n          v_transfer.from_branch_id,\r\n          v_transfer.to_branch_id\r\n        )\r\n      );\r\n\r\n      if v_item.destination_part_id is distinct from v_destination_part_id then\r\n        update public.inventory_transfer_request_items\r\n        set\r\n          destination_part_id = v_destination_part_id,\r\n          updated_at = now()\r\n        where id = v_item.id;\r\n      end if;\r\n\r\n      perform public.apply_inventory_delta(\r\n        v_destination_part_id,\r\n        v_transfer.to_branch_id,\r\n        -v_item.quantity,\r\n        v_reason,\r\n        'devolucion',\r\n        'inventory_transfer_requests',\r\n        p_transfer_id,\r\n        jsonb_build_object('direction', 'salida', 'part_id', v_destination_part_id)\r\n      );\r\n\r\n      perform public.apply_inventory_delta(\r\n        v_item.part_id,\r\n        v_transfer.from_branch_id,\r\n        v_item.quantity,\r\n        v_reason,\r\n        'devolucion',\r\n        'inventory_transfer_requests',\r\n        p_transfer_id,\r\n        jsonb_build_object('direction', 'ingreso', 'part_id', v_item.part_id)\r\n      );\r\n    end loop;\r\n  elsif v_action = 'reposicion' then\r\n    for v_item in\r\n      select i.id, i.part_id, i.quantity, i.destination_part_id\r\n      from public.inventory_transfer_request_items i\r\n      where i.transfer_id = p_transfer_id\r\n    loop\r\n      v_destination_part_id := coalesce(\r\n        v_item.destination_part_id,\r\n        public.ensure_transfer_destination_part(\r\n          v_item.part_id,\r\n          v_transfer.from_branch_id,\r\n          v_transfer.to_branch_id\r\n        )\r\n      );\r\n\r\n      if v_item.destination_part_id is distinct from v_destination_part_id then\r\n        update public.inventory_transfer_request_items\r\n        set\r\n          destination_part_id = v_destination_part_id,\r\n          updated_at = now()\r\n        where id = v_item.id;\r\n      end if;\r\n\r\n      perform public.apply_inventory_delta(\r\n        v_item.part_id,\r\n        v_transfer.from_branch_id,\r\n        -v_item.quantity,\r\n        v_reason,\r\n        'reposicion',\r\n        'inventory_transfer_requests',\r\n        p_transfer_id,\r\n        jsonb_build_object('direction', 'salida', 'part_id', v_item.part_id)\r\n      );\r\n\r\n      perform public.apply_inventory_delta(\r\n        v_destination_part_id,\r\n        v_transfer.to_branch_id,\r\n        v_item.quantity,\r\n        v_reason,\r\n        'reposicion',\r\n        'inventory_transfer_requests',\r\n        p_transfer_id,\r\n        jsonb_build_object('direction', 'ingreso', 'part_id', v_destination_part_id)\r\n      );\r\n    end loop;\r\n  end if;\r\n\r\n  v_status := case v_action\r\n    when 'anulacion' then 'anulled'\r\n    when 'devolucion' then 'returned'\r\n    else 'replenished'\r\n  end;\r\n\r\n  update public.inventory_transfer_requests\r\n  set\r\n    status = v_status,\r\n    resolved_by = auth.uid(),\r\n    resolved_at = now(),\r\n    resolution_type = v_action,\r\n    resolution_reason = v_reason,\r\n    updated_at = now()\r\n  where id = p_transfer_id;\r\n\r\n  insert into public.inventory_transfer_action_history (\r\n    transfer_id,\r\n    action_type,\r\n    reason,\r\n    performed_by,\r\n    details\r\n  )\r\n  values (\r\n    p_transfer_id,\r\n    v_action,\r\n    v_reason,\r\n    auth.uid(),\r\n    jsonb_build_object('status', v_status)\r\n  );\r\n\r\n  return p_transfer_id;\r\nend;\r\n$function$\n"
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
    "function_name": "complete_inventory_transfer_request",
    "parameters": "p_transfer_id uuid, p_reason text",
    "return_type": "uuid",
    "full_definition": "CREATE OR REPLACE FUNCTION public.complete_inventory_transfer_request(p_transfer_id uuid, p_reason text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_transfer public.inventory_transfer_requests%rowtype;\r\n  v_item record;\r\n  v_reason text;\r\n  v_destination_part_id uuid;\r\nbegin\r\n  if not public.inventory_has_management_access() then\r\n    raise exception 'Only admin or manager can complete transfers';\r\n  end if;\r\n\r\n  select *\r\n  into v_transfer\r\n  from public.inventory_transfer_requests r\r\n  where r.id = p_transfer_id\r\n  for update;\r\n\r\n  if not found then\r\n    raise exception 'Transfer not found';\r\n  end if;\r\n\r\n  if v_transfer.status <> 'pending' then\r\n    raise exception 'Only pending transfers can be completed';\r\n  end if;\r\n\r\n  if not public.inventory_is_admin() and v_transfer.to_branch_id <> public.current_user_branch_id() then\r\n    raise exception 'Manager can only complete transfers for own branch destination';\r\n  end if;\r\n\r\n  v_reason := coalesce(nullif(trim(p_reason), ''), 'Traspaso completado');\r\n\r\n  for v_item in\r\n    select i.id, i.part_id, i.quantity, i.destination_part_id\r\n    from public.inventory_transfer_request_items i\r\n    where i.transfer_id = p_transfer_id\r\n  loop\r\n    v_destination_part_id := coalesce(\r\n      v_item.destination_part_id,\r\n      public.ensure_transfer_destination_part(\r\n        v_item.part_id,\r\n        v_transfer.from_branch_id,\r\n        v_transfer.to_branch_id\r\n      )\r\n    );\r\n\r\n    if v_item.destination_part_id is distinct from v_destination_part_id then\r\n      update public.inventory_transfer_request_items\r\n      set\r\n        destination_part_id = v_destination_part_id,\r\n        updated_at = now()\r\n      where id = v_item.id;\r\n    end if;\r\n\r\n    perform public.apply_inventory_delta(\r\n      v_item.part_id,\r\n      v_transfer.from_branch_id,\r\n      -v_item.quantity,\r\n      v_reason,\r\n      'traspaso_salida',\r\n      'inventory_transfer_requests',\r\n      p_transfer_id,\r\n      jsonb_build_object('to_branch_id', v_transfer.to_branch_id, 'from_part_id', v_item.part_id)\r\n    );\r\n\r\n    perform public.apply_inventory_delta(\r\n      v_destination_part_id,\r\n      v_transfer.to_branch_id,\r\n      v_item.quantity,\r\n      v_reason,\r\n      'traspaso_ingreso',\r\n      'inventory_transfer_requests',\r\n      p_transfer_id,\r\n      jsonb_build_object('from_branch_id', v_transfer.from_branch_id, 'to_part_id', v_destination_part_id)\r\n    );\r\n  end loop;\r\n\r\n  update public.inventory_transfer_requests\r\n  set\r\n    status = 'completed',\r\n    resolved_by = auth.uid(),\r\n    resolved_at = now(),\r\n    resolution_type = null,\r\n    resolution_reason = v_reason,\r\n    updated_at = now()\r\n  where id = p_transfer_id;\r\n\r\n  insert into public.inventory_transfer_action_history (\r\n    transfer_id,\r\n    action_type,\r\n    reason,\r\n    performed_by,\r\n    details\r\n  )\r\n  values (\r\n    p_transfer_id,\r\n    'completado',\r\n    v_reason,\r\n    auth.uid(),\r\n    '{}'::jsonb\r\n  );\r\n\r\n  return p_transfer_id;\r\nend;\r\n$function$\n"
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
    "full_definition": "CREATE OR REPLACE FUNCTION public.create_inventory_entry(p_branch_id uuid, p_part_id uuid, p_quantity numeric, p_reason text DEFAULT NULL::text, p_source_reference text DEFAULT NULL::text, p_supplier_name text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_unit_cost numeric DEFAULT NULL::numeric, p_unit_price numeric DEFAULT NULL::numeric, p_currency text DEFAULT 'BOB'::text, p_exchange_rate numeric DEFAULT NULL::numeric)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_entry_id uuid;\r\n  v_currency text;\r\n  v_reason text;\r\nbegin\r\n  if not public.inventory_is_admin() then\r\n    raise exception 'Only admin can register inventory entries';\r\n  end if;\r\n\r\n  if p_branch_id is null or p_part_id is null then\r\n    raise exception 'Branch and product are required';\r\n  end if;\r\n\r\n  if p_quantity is null or p_quantity <= 0 then\r\n    raise exception 'Quantity must be greater than zero';\r\n  end if;\r\n\r\n  if not exists (\r\n    select 1\r\n    from public.parts p\r\n    where p.id = p_part_id\r\n      and p.branch_id = p_branch_id\r\n  ) then\r\n    raise exception 'Product % does not belong to branch %', p_part_id, p_branch_id;\r\n  end if;\r\n\r\n  if p_unit_cost is not null and p_unit_cost < 0 then\r\n    raise exception 'Unit cost cannot be negative';\r\n  end if;\r\n\r\n  if p_unit_price is not null and p_unit_price < 0 then\r\n    raise exception 'Unit price cannot be negative';\r\n  end if;\r\n\r\n  v_currency := upper(coalesce(nullif(trim(p_currency), ''), 'BOB'));\r\n  if v_currency not in ('BOB', 'USD') then\r\n    raise exception 'Currency must be BOB or USD';\r\n  end if;\r\n\r\n  if v_currency = 'USD' and (p_exchange_rate is null or p_exchange_rate <= 0) then\r\n    raise exception 'Exchange rate is required and must be greater than zero for USD entries';\r\n  end if;\r\n\r\n  v_reason := coalesce(nullif(trim(p_reason), ''), 'Ingreso de mercaderia');\r\n\r\n  insert into public.inventory_entries (\r\n    branch_id,\r\n    part_id,\r\n    quantity,\r\n    unit_cost,\r\n    unit_price,\r\n    currency,\r\n    exchange_rate,\r\n    source_reference,\r\n    supplier_name,\r\n    reason,\r\n    notes,\r\n    created_by\r\n  )\r\n  values (\r\n    p_branch_id,\r\n    p_part_id,\r\n    p_quantity,\r\n    p_unit_cost,\r\n    p_unit_price,\r\n    v_currency,\r\n    case when v_currency = 'USD' then p_exchange_rate else null end,\r\n    nullif(trim(coalesce(p_source_reference, '')), ''),\r\n    nullif(trim(coalesce(p_supplier_name, '')), ''),\r\n    v_reason,\r\n    nullif(trim(coalesce(p_notes, '')), ''),\r\n    auth.uid()\r\n  )\r\n  returning id into v_entry_id;\r\n\r\n  if p_unit_cost is not null or p_unit_price is not null then\r\n    update public.parts\r\n    set\r\n      cost = coalesce(p_unit_cost, cost),\r\n      price = coalesce(p_unit_price, price),\r\n      updated_by = auth.uid(),\r\n      updated_at = now()\r\n    where id = p_part_id;\r\n  end if;\r\n\r\n  perform public.apply_inventory_delta(\r\n    p_part_id,\r\n    p_branch_id,\r\n    p_quantity,\r\n    v_reason,\r\n    'ingreso_restock',\r\n    'inventory_entries',\r\n    v_entry_id,\r\n    jsonb_build_object(\r\n      'source_reference', p_source_reference,\r\n      'supplier_name', p_supplier_name,\r\n      'currency', v_currency,\r\n      'exchange_rate', case when v_currency = 'USD' then p_exchange_rate else null end,\r\n      'unit_cost', p_unit_cost,\r\n      'unit_price', p_unit_price\r\n    )\r\n  );\r\n\r\n  return v_entry_id;\r\nend;\r\n$function$\n"
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
    "full_definition": "CREATE OR REPLACE FUNCTION public.create_inventory_transfer_request(p_from_branch_id uuid, p_to_branch_id uuid, p_items jsonb, p_notes text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  v_transfer_id uuid;\r\n  v_item jsonb;\r\n  v_part_id uuid;\r\n  v_qty numeric(12,3);\r\n  v_item_count integer := 0;\r\nbegin\r\n  if not public.inventory_has_management_access() then\r\n    raise exception 'Only admin or manager can create transfers';\r\n  end if;\r\n\r\n  if p_from_branch_id is null or p_to_branch_id is null then\r\n    raise exception 'Origin and destination branches are required';\r\n  end if;\r\n\r\n  if p_from_branch_id = p_to_branch_id then\r\n    raise exception 'Origin and destination branches must be different';\r\n  end if;\r\n\r\n  if not public.inventory_can_manage_branch(p_from_branch_id) then\r\n    raise exception 'No permission for origin branch';\r\n  end if;\r\n\r\n  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then\r\n    raise exception 'At least one item is required';\r\n  end if;\r\n\r\n  insert into public.inventory_transfer_requests (\r\n    from_branch_id,\r\n    to_branch_id,\r\n    status,\r\n    notes,\r\n    requested_by,\r\n    requested_at\r\n  )\r\n  values (\r\n    p_from_branch_id,\r\n    p_to_branch_id,\r\n    'pending',\r\n    nullif(trim(coalesce(p_notes, '')), ''),\r\n    auth.uid(),\r\n    now()\r\n  )\r\n  returning id into v_transfer_id;\r\n\r\n  for v_item in select * from jsonb_array_elements(p_items)\r\n  loop\r\n    v_part_id := nullif(v_item->>'part_id', '')::uuid;\r\n    v_qty := coalesce((v_item->>'quantity')::numeric, 0);\r\n\r\n    if v_part_id is null or v_qty <= 0 then\r\n      raise exception 'Invalid transfer item payload';\r\n    end if;\r\n\r\n    if not exists (\r\n      select 1\r\n      from public.parts p\r\n      where p.id = v_part_id\r\n        and p.branch_id = p_from_branch_id\r\n    ) then\r\n      raise exception 'Product % does not belong to origin branch', v_part_id;\r\n    end if;\r\n\r\n    insert into public.inventory_transfer_request_items (\r\n      transfer_id,\r\n      part_id,\r\n      quantity\r\n    )\r\n    values (\r\n      v_transfer_id,\r\n      v_part_id,\r\n      v_qty\r\n    )\r\n    on conflict (transfer_id, part_id)\r\n    do update set\r\n      quantity = public.inventory_transfer_request_items.quantity + excluded.quantity,\r\n      updated_at = now();\r\n\r\n    v_item_count := v_item_count + 1;\r\n  end loop;\r\n\r\n  if v_item_count = 0 then\r\n    raise exception 'At least one valid transfer item is required';\r\n  end if;\r\n\r\n  insert into public.inventory_transfer_action_history (\r\n    transfer_id,\r\n    action_type,\r\n    reason,\r\n    performed_by,\r\n    details\r\n  )\r\n  values (\r\n    v_transfer_id,\r\n    'creado',\r\n    coalesce(nullif(trim(p_notes), ''), 'Traspaso pendiente creado'),\r\n    auth.uid(),\r\n    jsonb_build_object('items', v_item_count)\r\n  );\r\n\r\n  return v_transfer_id;\r\nend;\r\n$function$\n"
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
  }
]