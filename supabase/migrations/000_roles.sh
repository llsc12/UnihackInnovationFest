#!/bin/bash
# Creates Supabase internal roles and sets passwords.
# Runs as a Docker postgres init script — POSTGRES_PASSWORD is available from env.
set -e

psql -v ON_ERROR_STOP=1 \
     -v "pgpass=$POSTGRES_PASSWORD" \
     --username "postgres" \
     --dbname "postgres" <<-'EOSQL'

  -- Create roles needed by Supabase services (idempotent)
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
      CREATE ROLE supabase_admin LOGIN SUPERUSER REPLICATION CREATEROLE CREATEDB;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
      CREATE ROLE service_role NOLOGIN BYPASSRLS;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
      CREATE ROLE authenticator NOINHERIT LOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
      CREATE ROLE supabase_auth_admin NOINHERIT LOGIN;
    END IF;
  END
  $$;

  -- Set passwords for login roles (:'pgpass' is substituted by psql, not bash)
  ALTER ROLE authenticator       WITH PASSWORD :'pgpass';
  ALTER ROLE supabase_auth_admin WITH PASSWORD :'pgpass';

  -- Role hierarchy PostgREST needs to switch into
  GRANT anon          TO authenticator;
  GRANT authenticated TO authenticator;
  GRANT service_role  TO authenticator;

  -- PostgreSQL 15 removed the default CREATE-on-public privilege.
  GRANT USAGE, CREATE ON SCHEMA public TO supabase_auth_admin;
  GRANT USAGE, CREATE ON SCHEMA public TO authenticated, anon, service_role;

  -- GoTrue expects an auth schema it owns
  CREATE SCHEMA IF NOT EXISTS auth;
  ALTER SCHEMA auth OWNER TO supabase_auth_admin;
  GRANT ALL ON SCHEMA auth TO supabase_auth_admin;

EOSQL
