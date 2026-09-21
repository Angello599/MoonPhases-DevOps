-- Diario de Observacion Lunar
-- Una nota por fecha, sin autenticacion de usuario.

CREATE TABLE IF NOT EXISTS moon_notes (
  id SERIAL PRIMARY KEY,
  note_date DATE NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Datos de ejemplo (opcional, para probar rapido)
INSERT INTO moon_notes (note_date, content) VALUES
  ('2026-09-07', 'Luna llena muy brillante, cielo despejado.'),
  ('2026-09-14', 'No se vio nada, estaba nublado.')
ON CONFLICT (note_date) DO NOTHING;
