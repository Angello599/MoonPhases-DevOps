import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';

dotenv.config();

const { Pool } = pg;

const password = process.env.DB_PASSWORD ?? (
  process.env.DB_PASSWORD_FILE
    ? readFileSync(process.env.DB_PASSWORD_FILE, 'utf8').trim()
    : undefined
);

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password,
  database: process.env.DB_NAME
});
