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
    profile_icon
)
VALUES (
    'nilton.naab@gmail.com',
    crypt('@2Organela', gen_salt('bf', 10)),
    'Nilton Aguiar',
    'nilton.naab@gmail.com',
    'Rua Organela',
    'Cuiaba',
    'MT',
    '78000-000',
    'Brasil',
    'operator'
)
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
    profile_icon = EXCLUDED.profile_icon,
    updated_at = NOW(),
    deleted_at = NULL;
