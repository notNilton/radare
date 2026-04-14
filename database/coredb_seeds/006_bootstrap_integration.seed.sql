-- External tag mappings for the demo MQTT connector.
-- Maps broker topics to local tags using actual schema columns.
INSERT INTO external_tag_mappings (tenant_id, tag_id, connector_type, external_name, topic)
SELECT
    tags.tenant_id,
    tags.id,
    'mqtt',
    'factory/line1/inlet_flow',
    'factory/line1/inlet_flow'
FROM tags
WHERE tags.name = 'flow_inlet'
ON CONFLICT DO NOTHING;

INSERT INTO external_tag_mappings (tenant_id, tag_id, connector_type, external_name, topic)
SELECT
    tags.tenant_id,
    tags.id,
    'mqtt',
    'factory/line1/outlet_flow',
    'factory/line1/outlet_flow'
FROM tags
WHERE tags.name = 'flow_outlet'
ON CONFLICT DO NOTHING;
