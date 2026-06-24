-- Mark the InitialSchema baseline migration as already executed.
--
-- Run this ONCE against the existing database BEFORE deploying the backend
-- with `synchronize: false` + `migrationsRun: true`. It creates TypeORM's
-- `migrations` bookkeeping table and records the baseline as run, so TypeORM
-- never tries to (re)create tables that already exist.
--
-- This script is idempotent and safe: it only touches the `migrations`
-- bookkeeping table. It does NOT modify any data table (users, clients,
-- projects, time_records) and does NOT delete or alter existing rows.
--
-- Run with: psql "$DATABASE_URL" -f scripts/mark-baseline-run.sql
--   or paste into the Neon SQL editor.

CREATE TABLE IF NOT EXISTS "migrations" (
  "id" SERIAL NOT NULL,
  "timestamp" bigint NOT NULL,
  "name" character varying NOT NULL,
  CONSTRAINT "migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "migrations" ("timestamp", "name")
SELECT 1719139200000, 'InitialSchema1719139200000'
WHERE NOT EXISTS (
  SELECT 1 FROM "migrations" WHERE "name" = 'InitialSchema1719139200000'
);

-- Sanity check: should print one row.
SELECT id, timestamp, name FROM "migrations" ORDER BY id;
