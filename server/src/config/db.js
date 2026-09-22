import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { Pool } = pg

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'password123',
      database: process.env.PGDATABASE || 'embed_aiot_ems',
    }

export const pool = new Pool({
  ...poolConfig,
  max: 20, // max 20 connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

let isDbConnected = false

export async function testDbConnection() {
  try {
    const client = await pool.connect()
    const res = await client.query('SELECT current_database(), version()')
    client.release()
    isDbConnected = true
    console.log(`[Database] Connected to PostgreSQL: ${res.rows[0].current_database}`)
    return true
  } catch (err) {
    isDbConnected = false
    console.warn(`[Database] Connection notice: ${err.message}`)
    console.warn(`[Database] If you haven't started PostgreSQL yet, run 'docker compose up -d' or set DATABASE_URL in .env`)
    return false
  }
}

export function isConnected() {
  return isDbConnected
}

export async function query(text, params) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    return res
  } catch (err) {
    console.error(`[Database Query Error] on: "${text}" -> ${err.message}`)
    throw err
  }
}

export async function getClient() {
  return await pool.connect()
}
