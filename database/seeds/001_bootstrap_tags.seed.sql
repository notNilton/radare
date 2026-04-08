INSERT INTO tags (name, description, unit)
VALUES
    ('flow_inlet', 'Tag inicial de vazao de entrada para bootstrap do ambiente', 'kg/h'),
    ('flow_outlet', 'Tag inicial de vazao de saida para bootstrap do ambiente', 'kg/h'),
    ('pressure_main', 'Tag inicial de pressao da linha principal', 'bar')
ON CONFLICT (name) DO NOTHING;
