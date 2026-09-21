import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Verificación de estado (útil para el healthcheck de Docker)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
