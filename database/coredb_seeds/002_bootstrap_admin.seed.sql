CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (
    username,
    password,
    name,
    contact_email,
    street,
    city,
    state,
    zip_code,
    country,
    role,
    tenant_id
)
SELECT 
    'nilton.naab@gmail.com',
    crypt('@2Organela', gen_salt('bf', 10)),
    'Nilton Aguiar',
    'nilton.naab@gmail.com',
    'Rua Organela',
    'Cuiaba',
    'MT',
    '78000-000',
    'Brasil',
    'admin',
    tenants.id
FROM tenants
WHERE tenants.slug = 'nilbyte'
ON CONFLICT (username) DO UPDATE
SET
    password = crypt('@2Organela', gen_salt('bf', 10)),
    name = EXCLUDED.name,
    contact_email = EXCLUDED.contact_email,
    street = EXCLUDED.street,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip_code = EXCLUDED.zip_code,
    country = EXCLUDED.country,
    role = EXCLUDED.role,
    tenant_id = EXCLUDED.tenant_id,
    updated_at = NOW(),
    deleted_at = NULL;
