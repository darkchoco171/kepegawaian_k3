import * as dotenv from "dotenv";
dotenv.config();

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// DATABASE_URL terbaca dari environment variable
const sql = neon(process.env.DATABASE_URL!);

// Inisialisasi Drizzle dengan schema yang sudah dibuat
export const db = drizzle(sql, { schema });