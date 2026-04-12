ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'operador'
        CHECK (role IN ('admin', 'operador', 'auditor'));
