-- =============================================================================
-- Embed AIoT (CF Smart EMS) — Production Seed Data
-- =============================================================================

-- Clear existing data (optional for fresh setups)
TRUNCATE TABLE telemetry_data, alarm_events, linkage_records, schedule_tasks, 
  alarm_rules, alarm_contacts, device_group_members, device_groups, 
  access_group_devices, access_groups, facility_nodes, devices, 
  slave_variables, template_slaves, device_templates, gateways, 
  users, organizations, products, subscriptions, slab_rates, custom_dashboards RESTART IDENTITY CASCADE;

-- -----------------------------------------------------------------------------
-- 1. Organizations
-- -----------------------------------------------------------------------------
INSERT INTO organizations (id, name, description, status, device_types, created_at) VALUES
(1, 'Ambition', 'Main technology partner', 'Active', '["ems", "aqms", "soil", "weatherstation"]'::jsonb, '2024-01-15'),
(2, 'FICO', 'Industrial furnace client', 'Active', '["ems"]'::jsonb, '2024-02-10'),
(3, 'C Power', 'Power distribution', 'Active', '["ems"]'::jsonb, '2024-03-05'),
(4, 'NUST', 'University campus EMS', 'Active', '["ems", "aqms", "weatherstation", "other"]'::jsonb, '2024-03-20'),
(5, 'Guest Org', 'Demo organization', 'Inactive', '["ems"]'::jsonb, '2024-04-01'),
(6, 'Supra Steel', 'Steel furnace monitoring', 'Active', '["ems"]'::jsonb, '2024-04-15'),
(7, 'Japan Electronics', 'Electronics manufacturer', 'Active', '["ems", "weatherstation"]'::jsonb, '2024-05-01'),
(8, 'Bakery', 'Commercial bakery', 'Active', '["ems", "weatherstation"]'::jsonb, '2024-05-10'),
(9, 'Red Chilli', 'Restaurant chain', 'Active', '["ems"]'::jsonb, '2024-05-20'),
(10, 'Delicia Warehouse', 'Cold storage facility', 'Active', '["ems", "soil"]'::jsonb, '2024-06-01'),
(11, 'AFL', 'AFL Manufacturing Facilities', 'Active', '["ems"]'::jsonb, '2024-06-15'),
(12, 'Smart Agritech Lab', 'Agricultural Monitoring Lab', 'Active', '["soil", "aqms"]'::jsonb, '2024-07-01');

SELECT setval('organizations_id_seq', (SELECT MAX(id) FROM organizations));

-- -----------------------------------------------------------------------------
-- 2. Users (Passwords: 'password123' hashed with bcrypt via pgcrypto)
-- -----------------------------------------------------------------------------
INSERT INTO users (id, org_id, name, email, password_hash, phone, role, status, device_types, created_at) VALUES
-- Super Admin
(100, NULL, 'App Admin', 'appadmin@yopmail.com', crypt('password123', gen_salt('bf', 10)), '+92-300-0000000', 'admin', 'Active', '["ems", "aqms", "soil", "weatherstation", "other"]'::jsonb, '2024-01-01'),
-- Org Admins & Users
(1, 1, 'Huzaifa Ahmed', 'huzaifa@cf.com', crypt('password123', gen_salt('bf', 10)), '+92-300-1234567', 'org', 'Active', '["ems", "aqms", "soil", "weatherstation"]'::jsonb, '2024-01-20'),
(200, 1, 'Ambition Org Admin', 'org@cfsmartems.com', crypt('password123', gen_salt('bf', 10)), '+92-300-9999999', 'org', 'Active', '["ems", "aqms", "soil", "weatherstation"]'::jsonb, '2024-01-20'),
(11, 1, 'Ayesha Khan', 'ayesha.ambition@cf.com', crypt('password123', gen_salt('bf', 10)), '+92-311-1029384', 'user', 'Active', '["ems"]'::jsonb, '2026-06-12'),
(12, 1, 'Omar Farooq', 'omar.ambition@cf.com', crypt('password123', gen_salt('bf', 10)), '+92-312-5647382', 'user', 'Active', '["ems", "aqms"]'::jsonb, '2026-06-18'),
(2, 2, 'Ali Raza', 'ali@fico.com', crypt('password123', gen_salt('bf', 10)), '+92-301-2345678', 'user', 'Active', '["ems"]'::jsonb, '2024-02-15'),
(3, 3, 'Sara Khan', 'sara@cpower.com', crypt('password123', gen_salt('bf', 10)), '+92-302-3456789', 'user', 'Active', '["ems"]'::jsonb, '2024-03-10'),
(4, 4, 'Ahmed Malik', 'ahmed@nust.edu', crypt('password123', gen_salt('bf', 10)), '+92-303-4567890', 'user', 'Active', '["ems", "aqms", "weatherstation"]'::jsonb, '2024-03-25'),
(5, 5, 'Guest User', 'guest@guest.com', crypt('password123', gen_salt('bf', 10)), '+92-304-5678901', 'user', 'Inactive', '["ems"]'::jsonb, '2024-04-05'),
(6, 6, 'Bilal Hussain', 'bilal@supra.com', crypt('password123', gen_salt('bf', 10)), '+92-305-6789012', 'user', 'Active', '["ems"]'::jsonb, '2024-04-20'),
(7, 10, 'Miss Maryam', 'maryam@delicia.com', crypt('password123', gen_salt('bf', 10)), '+92-306-7890123', 'user', 'Active', '["ems", "soil"]'::jsonb, '2024-06-05'),
(8, 7, 'Taro Yamamoto', 'taro@japaelec.com', crypt('password123', gen_salt('bf', 10)), '+92-307-8901234', 'user', 'Active', '["ems", "weatherstation"]'::jsonb, '2024-05-05'),
(9, 8, 'Fatima Zahra', 'fatima@bakery.com', crypt('password123', gen_salt('bf', 10)), '+92-308-9012345', 'user', 'Active', '["ems", "weatherstation"]'::jsonb, '2024-05-15'),
(10, 9, 'Usman Ghani', 'usman@redchilli.com', crypt('password123', gen_salt('bf', 10)), '+92-309-0123456', 'user', 'Active', '["ems"]'::jsonb, '2024-05-25');

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- -----------------------------------------------------------------------------
-- 3. Gateways
-- -----------------------------------------------------------------------------
INSERT INTO gateways (id, org_id, name, serial_number, model, status, last_heartbeat) VALUES
(1, 1, 'CF-GW-001', 'SN-10021', 'CF-G200', 'Online', CURRENT_TIMESTAMP),
(2, 2, 'FICO-GW-001', 'SN-10022', 'CF-G200', 'Online', CURRENT_TIMESTAMP),
(3, 4, 'NUST-GW-001', 'SN-10023', 'CF-G100', 'Offline', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(4, 3, 'CPOWER-GW-01', 'SN-10024', 'CF-G200', 'Online', CURRENT_TIMESTAMP),
(5, 6, 'SUPRA-GW-001', 'SN-10025', 'CF-G300', 'Offline', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(6, 10, 'DELI-GW-001', 'SN-10026', 'CF-G200', 'Online', CURRENT_TIMESTAMP),
(11, 1, 'AFL-GW-MAIN', 'SN-AFL01', 'CF-G300', 'Online', CURRENT_TIMESTAMP),
(12, 1, 'AFL-GW-BSIDE', 'SN-AFL02', 'CF-G200', 'Online', CURRENT_TIMESTAMP);

SELECT setval('gateways_id_seq', (SELECT MAX(id) FROM gateways));

-- -----------------------------------------------------------------------------
-- 4. Device Templates
-- -----------------------------------------------------------------------------
INSERT INTO device_templates (id, org_id, name, method) VALUES
(1, 10, 'DELICIA WAREHOUSE', 'Modbus RTU'),
(2, 1, 'CF Smart Main Panel', 'Modbus TCP'),
(3, 2, 'Fico Furnace', 'Modbus RTU'),
(4, 1, 'PV GENSET SYNC', 'Modbus TCP'),
(5, 4, 'EMS PANEL', 'Modbus RTU'),
(6, 1, 'CF Smart Technologies Generator', 'Modbus TCP'),
(7, 1, 'IMRAN''s HOUSE', 'Modbus RTU'),
(50, 1, '200A TP MCCB B-Side Breaker', 'Modbus RTU'),
(58, 1, 'MCCB 400A (CT: 400/5A)', 'Modbus TCP'),
(71, 1, 'ACB 2500A (CT: 2500/5)', 'Modbus TCP'),
(80, NULL, 'Embed AIoT AQMS Node', 'Modbus RTU'),
(81, NULL, 'Embed AIoT Soil Probe', 'Modbus RTU'),
(82, NULL, 'Embed AIoT Weather Station', 'Modbus RTU');

SELECT setval('device_templates_id_seq', (SELECT MAX(id) FROM device_templates));

-- -----------------------------------------------------------------------------
-- 5. Template Slaves
-- -----------------------------------------------------------------------------
INSERT INTO template_slaves (id, template_id, name, slave_id, protocol, is_default) VALUES
(1, 1, 'DELICIA_SLAVE', 1, 'Modbus RTU', true),
(2, 2, 'CF_MAIN_SLAVE', 1, 'Modbus TCP', true),
(3, 3, 'FICO_SLAVE', 1, 'Modbus RTU', true),
(4, 50, 'MCCB_SLAVE', 1, 'Modbus RTU', true),
(5, 58, 'MCCB400_SLAVE', 1, 'Modbus TCP', true),
(6, 71, 'ACB2500_SLAVE', 1, 'Modbus TCP', true),
(7, 80, 'AQMS_SLAVE', 1, 'Modbus RTU', true),
(8, 81, 'SOIL_SLAVE', 1, 'Modbus RTU', true),
(9, 82, 'WEATHER_SLAVE', 1, 'Modbus RTU', true);

SELECT setval('template_slaves_id_seq', (SELECT MAX(id) FROM template_slaves));

-- -----------------------------------------------------------------------------
-- 6. Slave Variables (Energy + Environmental Registers)
-- -----------------------------------------------------------------------------
INSERT INTO slave_variables 
(id, slave_id, number, name, unit, icon, identifier, variable_type, register_func_code, register_address, data_format, number_format, storage_variable, storage_timing, read_write, acquisition_formula, line_chart_color) 
VALUES
-- Standard EMS Variables (for Slave 2: CF Main Panel)
(1, 2, 1, 'Voltage A', 'V', 'Voltage', 'voltageA', 'Directly collected variables', '3(Holding Register)', '40258', 'Unsigned Word', 'Integer', true, true, 'Read Only', 'x * 0.1', '#F5A623'),
(2, 2, 2, 'Voltage B', 'V', 'Voltage', 'voltageB', 'Directly collected variables', '3(Holding Register)', '40259', 'Unsigned Word', 'Integer', true, true, 'Read Only', 'x * 0.1', '#3B82F6'),
(3, 2, 3, 'Voltage C', 'V', 'Voltage', 'voltageC', 'Directly collected variables', '3(Holding Register)', '40260', 'Unsigned Word', 'Integer', true, true, 'Read Only', 'x * 0.1', '#10B981'),
(4, 2, 4, 'Current A', 'A', 'Current', 'currentA', 'Directly collected variables', '3(Holding Register)', '40261', 'Unsigned Word', 'Decimal places', true, true, 'Read Only', 'x * 0.01', '#8B5CF6'),
(5, 2, 5, 'Total Active Power', 'kW', 'Power', 'power', 'Directly collected variables', '3(Holding Register)', '40277', 'Unsigned Word', 'Decimal places', true, true, 'Read Only', 'x * 0.1', '#EF4444'),
(6, 2, 6, 'Power Factor', '', 'Gauge', 'powerFactor', 'Directly collected variables', '3(Holding Register)', '40280', 'Unsigned Word', 'Decimal places', true, true, 'Read Only', 'x * 0.001', '#06B6D4'),
(7, 2, 7, 'Active Energy (Total)', 'kWh', 'Energy', 'energyConsumption', 'Directly collected variables', '3(Holding Register)', '40300', 'Unsigned Word', 'Integer', true, true, 'Read Only', 'x * 1', '#10B981'),
(8, 2, 8, 'Breaker Switch Status', '', 'Switch', 'switchStatus', 'Directly collected variables', '0(Coils Status)', '34609', 'Bit', 'Integer', true, false, 'Read/Write', 'x', '#F5A623'),

-- AQMS Variables (for Slave 7)
(9, 7, 1, 'Air Quality Index', 'AQI', 'Wind', 'aqi', 'Directly collected variables', '3(Holding Register)', '40001', 'Unsigned Word', 'Integer', true, true, 'Read Only', 'x', '#2563EB'),
(10, 7, 2, 'PM2.5', 'µg/m³', 'Wind', 'pm25', 'Directly collected variables', '3(Holding Register)', '40002', 'Unsigned Word', 'Integer', true, true, 'Read Only', 'x * 0.1', '#F59E0B'),
(11, 7, 3, 'CO2 Level', 'ppm', 'Wind', 'co2', 'Directly collected variables', '3(Holding Register)', '40003', 'Unsigned Word', 'Integer', true, true, 'Read Only', 'x', '#EF4444'),
(12, 7, 4, 'Temperature', '°C', 'Droplets', 'temperature', 'Directly collected variables', '3(Holding Register)', '40004', 'Unsigned Word', 'Decimal places', true, true, 'Read Only', 'x * 0.1', '#10B981'),
(13, 7, 5, 'Humidity', '%', 'Droplets', 'humidity', 'Directly collected variables', '3(Holding Register)', '40005', 'Unsigned Word', 'Decimal places', true, true, 'Read Only', 'x * 0.1', '#06B6D4'),

-- Soil Probe Variables (for Slave 8)
(14, 8, 1, 'Soil Moisture', '%', 'Droplets', 'moisture', 'Directly collected variables', '3(Holding Register)', '40010', 'Unsigned Word', 'Decimal places', true, true, 'Read Only', 'x * 0.1', '#3B82F6'),
(15, 8, 2, 'Soil Temperature', '°C', 'Droplets', 'soilTemp', 'Directly collected variables', '3(Holding Register)', '40011', 'Unsigned Word', 'Decimal places', true, true, 'Read Only', 'x * 0.1', '#F59E0B'),
(16, 8, 3, 'Conductivity (EC)', 'mS/cm', 'Droplets', 'conductivity', 'Directly collected variables', '3(Holding Register)', '40012', 'Unsigned Word', 'Decimal places', true, true, 'Read Only', 'x * 0.01', '#8B5CF6'),
(17, 8, 4, 'Soil pH', 'pH', 'Droplets', 'ph', 'Directly collected variables', '3(Holding Register)', '40013', 'Unsigned Word', 'Decimal places', true, true, 'Read Only', 'x * 0.1', '#10B981');

SELECT setval('slave_variables_id_seq', (SELECT MAX(id) FROM slave_variables));

-- -----------------------------------------------------------------------------
-- 7. Devices
-- -----------------------------------------------------------------------------
INSERT INTO devices (id, org_id, gateway_id, template_id, name, device_type, status, switch_on) VALUES
(1, 10, 6, 1, 'Main Wapda', 'ems', 'Online', true),
(2, 1, 1, 2, 'CF Smart Panel', 'ems', 'Online', true),
(3, 2, 2, 3, 'Fico Furnace 1', 'ems', 'Offline', false),
(4, 1, 1, 4, 'PV Genset Sync', 'ems', 'Online', true),
(5, 4, 3, 5, 'EMS Panel', 'ems', 'Offline', false),
(6, 6, 5, 3, 'Supra Furnace A', 'ems', 'Online', true),
(7, 1, 1, 7, 'Imran House Main', 'ems', 'Online', true),
(8, 3, 4, 6, 'C Power Gen', 'ems', 'Online', true),

-- AFL Heavy Breakers & Distribution Panels
(100, 1, 12, 50, 'AFL B - Ground Floor DB', 'ems', 'Online', true),
(108, 1, 12, 50, 'AFL B - Compressor 132kW', 'ems', 'Online', true),
(109, 1, 12, 50, 'AFL B - Compressor 55kW', 'ems', 'Online', true),
(112, 1, 12, 50, 'AFL B - Solar', 'ems', 'Online', true),
(116, 1, 11, 58, 'AFL Main - ST-Main DB', 'ems', 'Online', true),
(117, 1, 11, 58, 'AFL Main - G.F Washing Main Panels', 'ems', 'Online', true),
(119, 1, 11, 58, 'AFL Main - G.F Boiler Main-DB', 'ems', 'Online', true),
(133, 1, 11, 58, 'AFL Main - Solar Inverter 04', 'ems', 'Online', true),
(134, 1, 11, 58, 'AFL Main - Solar Inverter 05', 'ems', 'Online', true),
(136, 1, 11, 71, 'AFL Main - Main', 'ems', 'Online', true),
(137, 1, 11, 71, 'AFL Main - G1', 'ems', 'Online', true),
(138, 1, 11, 71, 'AFL Main - G2', 'ems', 'Online', true),

-- Environmental Devices
(200, 1, 11, 80, 'AFL - AQMS Ground Floor', 'aqms', 'Online', true),
(202, 1, 11, 81, 'AFL - Soil Probe Field A', 'soil', 'Online', true),
(212, 1, 11, 80, 'AFL - Weather Station Alpha', 'weatherstation', 'Online', true),
(206, 4, 3, 80, 'NUST - AQMS Block A', 'aqms', 'Online', true),
(208, 10, 6, 81, 'Delicia - Soil Probe Bay 1', 'soil', 'Online', true);

SELECT setval('devices_id_seq', (SELECT MAX(id) FROM devices));

-- -----------------------------------------------------------------------------
-- 8. Device Groups
-- -----------------------------------------------------------------------------
INSERT INTO device_groups (id, org_id, name, description, created_by, active) VALUES
(201, 1, 'Washing Area', 'Ground floor main washing panels and analyzers', 'org', true),
(202, 1, 'Boilers & Compressors', 'Ground floor boilers and heavy utility compressors', 'org', true),
(203, 1, 'Main DB Distribution', 'Incoming utility mains and main block breakers', 'org', true),
(204, 1, 'Solar Generation', 'Main solar inverter generation panels', 'org', true),
(205, 1, 'Backup Generators', 'G1 and G2 synchronization backup generation', 'org', true);

INSERT INTO device_group_members (group_id, device_id) VALUES
(201, 117),
(202, 119), (202, 108), (202, 109),
(203, 136), (203, 116),
(204, 133), (204, 134), (204, 112),
(205, 137), (205, 138);

SELECT setval('device_groups_id_seq', (SELECT MAX(id) FROM device_groups));

-- -----------------------------------------------------------------------------
-- 9. Alarm Settings & Contacts
-- -----------------------------------------------------------------------------
INSERT INTO alarm_contacts (id, org_id, name, phone, email, whatsapp, remark) VALUES
(1, 1, 'Huzaifa Ahmed', '+92-300-1234567', 'huzaifa@cf.com', '+92-300-1234567', 'Primary contact'),
(2, 2, 'Ali Raza', '+92-301-2345678', 'ali@fico.com', 'N/A', 'On-site manager'),
(3, 10, 'Miss Maryam', '+92-306-7890123', 'maryam@delicia.com', '+92-306-7890123', 'Ops manager');

INSERT INTO alarm_rules (id, org_id, name, device_id, variable_id, push_type, push_method, mechanism, condition_operator, threshold_value, status) VALUES
(1, 1, 'Overvoltage Alert', 2, 1, 'Template Trigger', 'Email', 'Instant', '>', 240.0, 'Active'),
(2, 2, 'High Current', 3, 4, 'Template Trigger', 'SMS', 'Delayed', '>', 25.0, 'Active'),
(3, 10, 'Power Outage', 1, 1, 'Template Trigger', 'Email', 'Instant', '<', 10.0, 'Active'),
(4, 1, 'Low Power Factor', 2, 6, 'Variable Threshold', 'WhatsApp', 'Instant', '<', 0.85, 'Active');

SELECT setval('alarm_contacts_id_seq', (SELECT MAX(id) FROM alarm_contacts));
SELECT setval('alarm_rules_id_seq', (SELECT MAX(id) FROM alarm_rules));

-- -----------------------------------------------------------------------------
-- 10. Products & Slab Rates
-- -----------------------------------------------------------------------------
INSERT INTO products (id, name, description, price, status) VALUES
(1, 'Basic EMS', 'Up to 5 devices', 'PKR 5,000/mo', 'Active'),
(2, 'Professional', 'Up to 20 devices', 'PKR 15,000/mo', 'Active'),
(3, 'Enterprise', 'Unlimited devices', 'PKR 40,000/mo', 'Active');

INSERT INTO slab_rates (id, org_id, variable_name, slave_name, total_unit, tariff, start_date, end_date) VALUES
(1, 10, 'Power Consumption (kWh)', 'Main Wapda', 12450, 'PKR 28/unit', '2026-01-01', '2026-12-31');

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('slab_rates_id_seq', (SELECT MAX(id) FROM slab_rates));

-- -----------------------------------------------------------------------------
-- 11. Initial Time-Series Telemetry (Historical Seed)
-- -----------------------------------------------------------------------------
INSERT INTO telemetry_data (time, device_id, variable_id, variable_key, raw_value, scaled_value) VALUES
(CURRENT_TIMESTAMP - INTERVAL '6 hours', 2, 1, 'voltageA', 2240, 224.0),
(CURRENT_TIMESTAMP - INTERVAL '6 hours', 2, 4, 'currentA', 1210, 12.1),
(CURRENT_TIMESTAMP - INTERVAL '6 hours', 2, 5, 'power', 82000, 8200.0),
(CURRENT_TIMESTAMP - INTERVAL '4 hours', 2, 1, 'voltageA', 2260, 226.0),
(CURRENT_TIMESTAMP - INTERVAL '4 hours', 2, 4, 'currentA', 1320, 13.2),
(CURRENT_TIMESTAMP - INTERVAL '4 hours', 2, 5, 'power', 89000, 8900.0),
(CURRENT_TIMESTAMP - INTERVAL '2 hours', 2, 1, 'voltageA', 2280, 228.0),
(CURRENT_TIMESTAMP - INTERVAL '2 hours', 2, 4, 'currentA', 1850, 18.5),
(CURRENT_TIMESTAMP - INTERVAL '2 hours', 2, 5, 'power', 124000, 12400.0),
(CURRENT_TIMESTAMP, 2, 1, 'voltageA', 2300, 230.0),
(CURRENT_TIMESTAMP, 2, 4, 'currentA', 2210, 22.1),
(CURRENT_TIMESTAMP, 2, 5, 'power', 148000, 14800.0);

-- -----------------------------------------------------------------------------
-- 12. MQTT Bridges (Matching Live Production Screen)
-- -----------------------------------------------------------------------------
INSERT INTO mqtt_bridges (id, name, org_id, broker_host, broker_port, subscribe_topic, command_topic, status, is_active, message_count) VALUES
(1, 'MQTT Bridge', 1,  '51.38.88.130', 1883, '/UploadTopic', '/DownTopic', 'CONNECTED', true, 1053842),
(2, 'MQTT Bridge', 11, '51.38.88.130', 1883, '/UploadTopic', '/DownTopic', 'CONNECTED', true, 1163308),
(3, 'MQTT Bridge', 4,  '51.38.88.130', 1883, '/UploadTopic', '/DownTopic', 'CONNECTED', true, 1487542),
(4, 'MQTT Bridge', 12, '51.38.88.130', 1883, '/UploadTopic', '/DownTopic', 'CONNECTED', true, 3694208);

SELECT setval('mqtt_bridges_id_seq', (SELECT MAX(id) FROM mqtt_bridges));
