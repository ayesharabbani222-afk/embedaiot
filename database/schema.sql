-- =============================================================================
-- Embed AIoT (CF Smart EMS) — Production Database Schema
-- Supports: PostgreSQL 14+ with optional TimescaleDB extension
-- =============================================================================

-- Enable UUID and Cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Attempt to enable TimescaleDB (if installed)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TimescaleDB extension not available. Falling back to standard PostgreSQL tables.';
END $$;

-- -----------------------------------------------------------------------------
-- 1. Organizations (Multi-Tenancy Root)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    device_types JSONB DEFAULT '["ems"]'::jsonb, -- ['ems', 'aqms', 'soil', 'weatherstation']
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. Users & RBAC
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    org_id INT REFERENCES organizations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'org', 'user')),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    device_types JSONB DEFAULT '["ems"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -----------------------------------------------------------------------------
-- 3. Gateways (Edge hardware collecting from meters/sensors)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gateways (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    model VARCHAR(100) DEFAULT 'CF-G200',
    status VARCHAR(50) DEFAULT 'Offline' CHECK (status IN ('Online', 'Offline')),
    ip_address VARCHAR(100),
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gateways_org ON gateways(org_id);
CREATE INDEX IF NOT EXISTS idx_gateways_serial ON gateways(serial_number);

-- -----------------------------------------------------------------------------
-- 4. Device Templates (Modbus Blueprint)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_templates (
    id SERIAL PRIMARY KEY,
    org_id INT REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = Global system template
    name VARCHAR(255) NOT NULL,
    method VARCHAR(50) DEFAULT 'Modbus RTU' CHECK (method IN ('Modbus RTU', 'Modbus TCP', 'Cloud Polling')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. Template Slaves (Modbus Protocol Endpoints)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS template_slaves (
    id SERIAL PRIMARY KEY,
    template_id INT NOT NULL REFERENCES device_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slave_id INT DEFAULT 1, -- Modbus Unit ID (1-247)
    protocol VARCHAR(50) DEFAULT 'Modbus RTU',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_slaves_template ON template_slaves(template_id);

-- -----------------------------------------------------------------------------
-- 6. Slave Variables (Modbus Register Map)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS slave_variables (
    id SERIAL PRIMARY KEY,
    slave_id INT NOT NULL REFERENCES template_slaves(id) ON DELETE CASCADE,
    number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    icon VARCHAR(100),
    identifier VARCHAR(100),
    variable_type VARCHAR(100) DEFAULT 'Directly collected variables', -- or 'Equation variables'
    register_func_code VARCHAR(100) DEFAULT '3(Holding Register)',
    register_address VARCHAR(50) NOT NULL, -- e.g. '40258'
    data_format VARCHAR(100) DEFAULT 'Unsigned Word',
    number_format VARCHAR(100) DEFAULT 'Integer',
    decimal_places_padding BOOLEAN DEFAULT false,
    storage_variable BOOLEAN DEFAULT true,
    storage_timing BOOLEAN DEFAULT true,
    read_write VARCHAR(50) DEFAULT 'Read Only',
    acquisition_formula TEXT, -- e.g. 'x * 0.1'
    control_formula TEXT,
    line_chart_color VARCHAR(50) DEFAULT '#F5A623',
    line_chart_limit VARCHAR(50),
    low_limit_line_chart VARCHAR(50),
    peak_time_start VARCHAR(20),
    peak_time_end VARCHAR(20),
    peak_off_time_start VARCHAR(20),
    peak_off_time_end VARCHAR(20),
    peak_time_color VARCHAR(50) DEFAULT '#00ff00',
    peak_off_time_color VARCHAR(50) DEFAULT '#ff0000',
    main_page_selection BOOLEAN DEFAULT false,
    sort INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_variables_slave ON slave_variables(slave_id);

-- -----------------------------------------------------------------------------
-- 7. Devices (Physical Meter/Analyzer/Sensor instances)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gateway_id INT REFERENCES gateways(id) ON DELETE SET NULL,
    template_id INT REFERENCES device_templates(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'ems', -- ems, aqms, soil, weatherstation, other
    status VARCHAR(50) DEFAULT 'Offline' CHECK (status IN ('Online', 'Offline')),
    switch_on BOOLEAN DEFAULT true, -- Remote breaker or relay state
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devices_org ON devices(org_id);
CREATE INDEX IF NOT EXISTS idx_devices_gateway ON devices(gateway_id);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type);

-- -----------------------------------------------------------------------------
-- 8. Facilities Hierarchy (Tree Node Structure)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facility_nodes (
    id VARCHAR(100) PRIMARY KEY, -- supports client UUIDs or strings like 'b-101'
    org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_id VARCHAR(100) REFERENCES facility_nodes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    node_type VARCHAR(100) NOT NULL, -- Organization, Campus, Site, Building, Floor, Department, Room, Asset, Device
    device_id INT REFERENCES devices(id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_facility_org ON facility_nodes(org_id);
CREATE INDEX IF NOT EXISTS idx_facility_parent ON facility_nodes(parent_id);

-- -----------------------------------------------------------------------------
-- 9. Groups & Access Control
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS access_groups (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_group_devices (
    access_group_id INT NOT NULL REFERENCES access_groups(id) ON DELETE CASCADE,
    device_id INT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (access_group_id, device_id)
);

CREATE TABLE IF NOT EXISTS device_groups (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(50) DEFAULT 'org',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device_group_members (
    group_id INT NOT NULL REFERENCES device_groups(id) ON DELETE CASCADE,
    device_id INT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, device_id)
);

-- -----------------------------------------------------------------------------
-- 10. Alarm Configuration & Events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alarm_contacts (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    whatsapp VARCHAR(50),
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alarm_rules (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    device_id INT REFERENCES devices(id) ON DELETE CASCADE,
    variable_id INT REFERENCES slave_variables(id) ON DELETE SET NULL,
    push_type VARCHAR(100) DEFAULT 'Template Trigger',
    push_method VARCHAR(100) DEFAULT 'Email', -- Email, SMS, WhatsApp
    mechanism VARCHAR(100) DEFAULT 'Instant', -- Instant, Delayed
    condition_operator VARCHAR(10) DEFAULT '>', -- >, <, >=, <=, ==
    threshold_value DOUBLE PRECISION DEFAULT 0.0,
    delay_seconds INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alarm_events (
    id BIGSERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    rule_id INT REFERENCES alarm_rules(id) ON DELETE SET NULL,
    device_id INT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    trigger_name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_value DOUBLE PRECISION,
    severity VARCHAR(50) DEFAULT 'Warning', -- Info, Warning, Critical
    status VARCHAR(50) DEFAULT 'Triggered' CHECK (status IN ('Triggered', 'Acknowledged', 'Resolved')),
    triggered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alarm_events_org ON alarm_events(org_id);
CREATE INDEX IF NOT EXISTS idx_alarm_events_device ON alarm_events(device_id);
CREATE INDEX IF NOT EXISTS idx_alarm_events_status ON alarm_events(status);

-- -----------------------------------------------------------------------------
-- 11. Linkage Records (SCADA Automation Rules)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS linkage_records (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    source_device_id INT REFERENCES devices(id) ON DELETE CASCADE,
    trigger_condition JSONB NOT NULL, -- e.g. {"variable": "voltageA", "op": ">", "value": 260}
    target_device_id INT REFERENCES devices(id) ON DELETE CASCADE,
    target_action JSONB NOT NULL, -- e.g. {"command": "switchOff", "coilAddress": "34609"}
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 12. Schedule Tasks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_tasks (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    device_id INT REFERENCES devices(id) ON DELETE CASCADE,
    schedule VARCHAR(100) NOT NULL, -- e.g. 'Daily 08:00', 'Mon 09:00'
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    last_run TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 13. Custom Dashboards & Drag-and-Drop Widgets
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS custom_dashboards (
    id VARCHAR(100) PRIMARY KEY, -- supports string IDs or UUIDs
    org_id INT REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    layout_config JSONB DEFAULT '[]'::jsonb, -- [{ i, x, y, w, h }, ...]
    widgets JSONB DEFAULT '[]'::jsonb, -- [{ id, type, metric, groupBy, color, ... }]
    is_default BOOLEAN DEFAULT false,
    dashboard_type VARCHAR(50) DEFAULT 'ems', -- 'ems', 'aqms', 'soil', 'weatherstation', 'unified'
    target_device VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dashboards_org ON custom_dashboards(org_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_user ON custom_dashboards(user_id);

-- -----------------------------------------------------------------------------
-- 14. Products, Subscriptions & Tariffs (Slab Rates)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    max_devices INT DEFAULT 5
);

CREATE TABLE IF NOT EXISTS slab_rates (
    id SERIAL PRIMARY KEY,
    org_id INT REFERENCES organizations(id) ON DELETE CASCADE,
    variable_name VARCHAR(255) DEFAULT 'Power Consumption (kWh)',
    slave_name VARCHAR(255),
    total_unit DOUBLE PRECISION DEFAULT 0,
    tariff VARCHAR(100) DEFAULT 'PKR 28/unit',
    start_date DATE,
    end_date DATE
);

-- -----------------------------------------------------------------------------
-- 15. The Telemetry Hypertable (Time-Series Core)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telemetry_data (
    time TIMESTAMPTZ NOT NULL,
    device_id INT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    variable_id INT REFERENCES slave_variables(id) ON DELETE CASCADE,
    variable_key VARCHAR(100), -- optional direct key: 'voltageA', 'currentA', 'power', etc.
    raw_value DOUBLE PRECISION,
    scaled_value DOUBLE PRECISION NOT NULL,
    quality SMALLINT DEFAULT 1 -- 1 = Good, 0 = Bad
);

-- Convert to TimescaleDB Hypertable if Timescale is installed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('telemetry_data', 'time', if_not_exists => TRUE);
        RAISE NOTICE 'telemetry_data converted to TimescaleDB hypertable successfully.';
    ELSE
        RAISE NOTICE 'TimescaleDB not loaded. Created standard PostgreSQL table with indices.';
    END IF;
END $$;

-- High-performance composite indices for real-time dashboards & chart queries
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON telemetry_data (device_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_dev_var_time ON telemetry_data (device_id, variable_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_key_time ON telemetry_data (device_id, variable_key, time DESC);

-- Enable automatic compression if TimescaleDB is present
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        BEGIN
            ALTER TABLE telemetry_data SET (
                timescaledb.compress,
                timescaledb.compress_segmentby = 'device_id, variable_key'
            );
            PERFORM add_compression_policy('telemetry_data', INTERVAL '7 days', if_not_exists => TRUE);
            RAISE NOTICE 'TimescaleDB compression policy applied.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'TimescaleDB compression policy already exists or not supported.';
        END;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 16. MQTT Bridges (UI-Managed Ingestion Listeners)
-- -----------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_mqtt_bridges_org ON mqtt_bridges(org_id);
