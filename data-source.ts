import 'reflect-metadata';
import * as fs from 'fs';
import { DataSource } from 'typeorm';
import { User } from './src/users/user.entity';
import { Client } from './src/clients/client.entity';
import { Project } from './src/projects/project.entity';
import { TimeRecord } from './src/time-records/time-record.entity';
import { InitialSchema1719139200000 } from './src/migrations/1719139200000-InitialSchema';

const envPath = __dirname + '/.env';
const env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const url = env.DATABASE_URL || process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL is not set (check .env or environment)');
}

export default new DataSource({
  type: 'postgres',
  url,
  ssl: url.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  entities: [User, Client, Project, TimeRecord],
  migrations: [InitialSchema1719139200000],
  migrationsRun: false,
  synchronize: false,
  logging: false,
});
