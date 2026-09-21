import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Health check (util para Docker healthcheck despues)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Listar todas las notas
app.get('/api/notes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM moon_notes ORDER BY note_date DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener la nota de una fecha especifica (YYYY-MM-DD)
app.get('/api/notes/:date', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM moon_notes WHERE note_date = $1',
      [req.params.date]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No hay nota para esta fecha' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear o actualizar la nota de una fecha (upsert)
app.post('/api/notes', async (req, res) => {
  const { date, content } = req.body;
  if (!date || !content) {
    return res.status(400).json({ error: 'date y content son requeridos' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO moon_notes (note_date, content)
       VALUES ($1, $2)
       ON CONFLICT (note_date)
       DO UPDATE SET content = $2, updated_at = NOW()
       RETURNING *`,
      [date, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrar la nota de una fecha
app.delete('/api/notes/:date', async (req, res) => {
  try {
    await pool.query('DELETE FROM moon_notes WHERE note_date = $1', [
      req.params.date
    ]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
