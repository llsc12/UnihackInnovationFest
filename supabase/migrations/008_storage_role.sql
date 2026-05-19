-- supabase_storage_admin must exist so the storage-api's internal migrations
-- can GRANT privileges to it. Created in 000_roles.sh for fresh volumes;
-- this backfills it for pre-existing volumes. No password needed — we connect
-- to storage-api as the postgres superuser (DATABASE_URL in docker-compose).
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    CREATE ROLE supabase_storage_admin NOINHERIT CREATEROLE LOGIN;
  END IF;
END
$$;
