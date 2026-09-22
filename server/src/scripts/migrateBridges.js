import { pool } from '../config/db.js'

async function migrateBridges() {
  console.log('--- Migrating MQTT Bridges Table ---')
  try {
    // 1. Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mqtt_bridges (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) DEFAULT 'MQTT Bridge',
        org_id INT REFERENCES organizations(id) ON DELETE CASCADE,
        broker_host VARCHAR(255) NOT NULL DEFAULT '51.38.88.130',
        broker_port INT DEFAULT 1883,
        subscribe_topic VARCHAR(255) NOT NULL DEFAULT '/UploadTopic',
        command_topic VARCHAR(255) DEFAULT '/DownTopic',
        client_id VARCHAR(255),
        username VARCHAR(255),
        password VARCHAR(255),
        status VARCHAR(50) DEFAULT 'CONNECTED',
        is_active BOOLEAN DEFAULT true,
        message_count BIGINT DEFAULT 0,
        last_message_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✓ mqtt_bridges table created/verified.')

    // 2. Ensure AFL and Smart Agritech Lab orgs exist
    await pool.query(`
      INSERT INTO organizations (id, name, description, status, device_types) VALUES
      (11, 'AFL', 'AFL Manufacturing Facilities', 'Active', '["ems"]'::jsonb),
      (12, 'Smart Agritech Lab', 'Agricultural Monitoring Lab', 'Active', '["soil", "aqms"]'::jsonb)
      ON CONFLICT (name) DO NOTHING;
    `)
    console.log('✓ Organizations verified.')

    // 3. Insert initial bridges
    await pool.query(`
      INSERT INTO mqtt_bridges (id, name, org_id, broker_host, broker_port, subscribe_topic, command_topic, status, is_active, message_count) VALUES
      (1, 'MQTT Bridge', 1,  '51.38.88.130', 1883, '/UploadTopic', '/DownTopic', 'CONNECTED', true, 1053842),
      (2, 'MQTT Bridge', 11, '51.38.88.130', 1883, '/UploadTopic', '/DownTopic', 'CONNECTED', true, 1163308),
      (3, 'MQTT Bridge', 4,  '51.38.88.130', 1883, '/UploadTopic', '/DownTopic', 'CONNECTED', true, 1487542),
      (4, 'MQTT Bridge', 12, '51.38.88.130', 1883, '/UploadTopic', '/DownTopic', 'CONNECTED', true, 3694208)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        broker_host = EXCLUDED.broker_host,
        subscribe_topic = EXCLUDED.subscribe_topic,
        status = EXCLUDED.status,
        message_count = EXCLUDED.message_count;
    `)
    await pool.query(`SELECT setval('mqtt_bridges_id_seq', COALESCE((SELECT MAX(id) FROM mqtt_bridges), 1));`)
    console.log('✓ MQTT Bridges seeded and sequence set.')

    const res = await pool.query(`
      SELECT b.id, b.name, o.name as org, b.broker_host, b.subscribe_topic, b.status, b.message_count 
      FROM mqtt_bridges b 
      LEFT JOIN organizations o ON b.org_id = o.id
      ORDER BY b.id ASC
    `)
    console.table(res.rows)

    await pool.end()
    console.log('--- Completed Successfully! ---')
    process.exit(0)
  } catch (err) {
    console.error('Migration error:', err)
    await pool.end()
    process.exit(1)
  }
}

migrateBridges()
