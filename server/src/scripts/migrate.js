import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool, testDbConnection } from '../config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigration() {
  console.log('--- Embed AIoT Database Migration & Seeding ---')
  const connected = await testDbConnection()
  if (!connected) {
    console.error('Cannot connect to database. Please ensure PostgreSQL or TimescaleDB is running.')
    process.exit(1)
  }

  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql')
  const seedPath = path.resolve(__dirname, '../../../database/seed.sql')

  try {
    console.log(`[1/2] Reading schema from: ${schemaPath}`)
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
    console.log('[1/2] Executing schema.sql...')
    await pool.query(schemaSql)
    console.log('[1/2] Schema executed successfully!')

    console.log(`[2/2] Reading seed data from: ${seedPath}`)
    const seedSql = fs.readFileSync(seedPath, 'utf8')
    console.log('[2/2] Executing seed.sql...')
    await pool.query(seedSql)
    console.log('[2/2] Seed data populated successfully!')

    console.log('--- Migration completed successfully! ---')
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('Migration failed:', err)
    await pool.end()
    process.exit(1)
  }
}

runMigration()
