/*
 * Read-only schema introspection for the Slott database.
 *
 * Safety: opens a single transaction with SET TRANSACTION READ ONLY so it is
 * impossible for this script to write or modify any data. It only SELECTs from
 * pg_catalog / information_schema and prints the current schema as CREATE
 * TABLE statements, plus compares constraint names against the TypeORM
 * DefaultNamingStrategy (sha1-based) so we can author a baseline migration
 * that matches the schema that `synchronize: true` already created.
 *
 * Usage: node scripts/introspect-schema.mjs
 */
import fs from 'node:fs';
import pg from 'pg';
import crypto from 'node:crypto';

const envFile = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const connectionString = env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL missing in .env');
  process.exit(1);
}

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

// Replicate TypeORM DefaultNamingStrategy (sorted columns, sha1 prefix).
const typeormName = (prefix, table, cols, len) =>
  prefix + sha1(`${table}_${[...cols].sort().join('_')}`).substr(0, len);

const expected = {
  'users:PK': typeormName('PK_', 'users', ['id'], 27),
  'users:UQ:email': typeormName('UQ_', 'users', ['email'], 27),
  'clients:PK': typeormName('PK_', 'clients', ['id'], 27),
  'clients:UQ': typeormName('UQ_', 'clients', ['name', 'user_id'], 27),
  'clients:FK:user_id': typeormName('FK_', 'clients', ['user_id'], 27),
  'projects:PK': typeormName('PK_', 'projects', ['id'], 27),
  'projects:UQ': typeormName('UQ_', 'projects', ['client_id', 'name'], 27),
  'projects:FK:user_id': typeormName('FK_', 'projects', ['user_id'], 27),
  'projects:FK:client_id': typeormName('FK_', 'projects', ['client_id'], 27),
  'time_records:PK': typeormName('PK_', 'time_records', ['id'], 27),
  'time_records:FK:user_id': typeormName('FK_', 'time_records', ['user_id'], 27),
  'time_records:FK:project_id': typeormName('FK_', 'time_records', ['project_id'], 27),
};

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query('BEGIN READ ONLY');

  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  console.log('=== TABLES ===');
  console.log(tables.rows.map((r) => r.table_name).join(', '));

  const cols = await client.query(`
    SELECT table_name, column_name, data_type, udt_name,
           character_maximum_length, numeric_precision, numeric_scale,
           is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

  console.log('\n=== COLUMNS ===');
  for (const r of cols.rows) {
    const len = r.character_maximum_length ? `(${r.character_maximum_length})` : '';
    const num = r.numeric_precision ? `(${r.numeric_precision},${r.numeric_scale})` : '';
    console.log(
      `${r.table_name}.${r.column_name}  data_type=${r.data_type} udt=${r.udt_name}${len}${num}  nullable=${r.is_nullable}  default=${r.column_default ?? 'NULL'}`,
    );
  }

  const constraints = await client.query(`
    SELECT con.conname, rel.relname AS table_name, contype,
           pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = connamespace
    WHERE nsp.nspname = 'public'
    ORDER BY rel.relname, con.contype, con.conname;
  `);

  console.log('\n=== CONSTRAINTS ===');
  for (const r of constraints.rows) {
    console.log(`${r.table_name}  [${r.contype}]  ${r.conname}  =>  ${r.def}`);
  }

  console.log('\n=== TYPEORM NAME COMPARISON ===');
  const byTable = {};
  for (const r of constraints.rows) {
    (byTable[r.table_name] ??= []).push(r);
  }
  const checks = [
    ['users', 'p', 'users:PK'],
    ['users', 'u', 'users:UQ:email'],
    ['clients', 'p', 'clients:PK'],
    ['clients', 'u', 'clients:UQ'],
    ['clients', 'f', 'clients:FK:user_id'],
    ['projects', 'p', 'projects:PK'],
    ['projects', 'u', 'projects:UQ'],
    ['projects', 'f', 'projects:FK:user_id'],
    ['projects', 'f', 'projects:FK:client_id'],
    ['time_records', 'p', 'time_records:PK'],
    ['time_records', 'f', 'time_records:FK:user_id'],
    ['time_records', 'f', 'time_records:FK:project_id'],
  ];
  for (const [table, contype, key] of checks) {
    const actual = (byTable[table] || [])
      .filter((c) => c.contype === contype)
      .map((c) => c.conname);
    const exp = expected[key];
    const match = actual.includes(exp);
    console.log(`${match ? 'OK ' : 'XX '} ${key}: expected=${exp} actual=${JSON.stringify(actual)}`);
  }

  await client.query('ROLLBACK');
  await client.end();
} catch (e) {
  try {
    await client.query('ROLLBACK');
  } catch {}
  try {
    await client.end();
  } catch {}
  console.error('ERROR:', e.message);
  process.exit(1);
}
