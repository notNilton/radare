INSERT INTO tenants (name, slug, status)
VALUES ('Nilbyte Studios', 'nilbyte', 'active')
ON CONFLICT (slug) DO NOTHING;
