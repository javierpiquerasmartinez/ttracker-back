import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline schema migration.
 *
 * Captures the exact schema that `synchronize: true` had already created in
 * production (users, clients, projects, time_records) so the project can move
 * to a real, versioned migration system without losing existing data.
 *
 * Constraint names (PK_/UQ_/FK_ + sha1) were verified against the live
 * database and match TypeORM's DefaultNamingStrategy, so future
 * `migration:generate` runs produce clean diffs with no phantom changes.
 *
 * SAFETY: every statement is idempotent (`IF NOT EXISTS`) and all constraints
 * are declared inline. On a database that already has these tables (current
 * production) the whole migration is a no-op: `CREATE TABLE IF NOT EXISTS`
 * skips existing tables entirely, so no constraint is re-added and no data is
 * touched. On a fresh database it creates the full schema with the correct
 * constraint names.
 *
 * On the existing production database this migration is additionally marked
 * as already-executed (see scripts/mark-baseline-run.sql) so TypeORM never
 * tries to run it there at all — belt and suspenders.
 */
export class InitialSchema1719139200000 implements MigrationInterface {
  name = 'InitialSchema1719139200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "first_name" character varying(100),
        "last_name" character varying(100),
        "timezone" character varying(50) NOT NULL DEFAULT 'UTC',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "login_attempts" integer,
        "locked_until" timestamp with time zone,
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_5580903a7a60a0ab602dcce4642" UNIQUE ("user_id", "name"),
        CONSTRAINT "FK_07a7a09b04e7b035c9d90cf4984" FOREIGN KEY ("user_id") REFERENCES "users"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "client_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "estimated_hours" numeric(10,2),
        "status" character varying(50) NOT NULL DEFAULT 'active',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_694eabc944b8d8b28039f780a50" UNIQUE ("client_id", "name"),
        CONSTRAINT "FK_bd55b203eb9f92b0c8390380010" FOREIGN KEY ("user_id") REFERENCES "users"("id"),
        CONSTRAINT "FK_ca29f959102228649e714827478" FOREIGN KEY ("client_id") REFERENCES "clients"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "time_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "date" date NOT NULL,
        "start_time" time without time zone NOT NULL,
        "end_time" time without time zone NOT NULL,
        "duration_minutes" integer NOT NULL,
        "description" text,
        "record_type" character varying(50) NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_0d2985ead4ba3604143eee43f90" PRIMARY KEY ("id"),
        CONSTRAINT "FK_0149b95adf0ce34734ed1e11e93" FOREIGN KEY ("user_id") REFERENCES "users"("id"),
        CONSTRAINT "FK_36c0ed3c5f6755d0dee40175503" FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Destructive: drops all tables. Only safe on a throwaway database.
    await queryRunner.query(`DROP TABLE IF EXISTS "time_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
