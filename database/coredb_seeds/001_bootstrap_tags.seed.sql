INSERT INTO tags (name, description, unit, tenant_id)
SELECT t.name, t.description, t.unit, tenants.id
FROM (VALUES 
    ('flow_inlet', 'Tag inicial de vazao de entrada para bootstrap do ambiente', 'kg/h'),
    ('flow_outlet', 'Tag inicial de vazao de saida para bootstrap do ambiente', 'kg/h'),
    ('pressure_main', 'Tag inicial de pressao da linha principal', 'bar')
) AS t(name, description, unit)
CROSS JOIN tenants
WHERE tenants.slug = 'nilbyte'
ON CONFLICT (name) DO NOTHING;
