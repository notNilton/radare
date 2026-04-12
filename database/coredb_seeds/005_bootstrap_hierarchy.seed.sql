INSERT INTO sites (tenant_id, name, description)
SELECT tenants.id, 'Planta Principal', 'Unidade operacional de referência'
FROM tenants WHERE tenants.slug = 'nilbyte'
ON CONFLICT DO NOTHING;

INSERT INTO units (site_id, name, description)
SELECT sites.id, 'Unidade de Destilação', 'Processo de separação de misturas'
FROM sites
JOIN tenants ON sites.tenant_id = tenants.id
WHERE tenants.slug = 'nilbyte' AND sites.name = 'Planta Principal'
ON CONFLICT DO NOTHING;

INSERT INTO equipment (unit_id, name, description)
SELECT units.id, 'Coluna C-101', 'Torre de fracionamento principal'
FROM units
JOIN sites ON units.site_id = sites.id
JOIN tenants ON sites.tenant_id = tenants.id
WHERE tenants.slug = 'nilbyte' AND units.name = 'Unidade de Destilação'
ON CONFLICT DO NOTHING;
