import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// En dev, el host de Postgres es el nombre del servicio en Compose: "db"
const pool = new Pool({
  host: process.env.PGHOST || 'db',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'appdb'
});

// --- util peque: validación simple de email (suficiente para demo) ---
const isEmail = (s = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); 

// --- endpoints API ---
app.get('/api/health', async (_req, res) => {
  try {
    const r = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: r.rows[0] });
  } catch (e) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

app.get('/api/users', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, email, created_at FROM users ORDER BY id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// create user
app.post('/api/users', async (req, res) => {
  try {
    const { email } = req.body ?? {};
    if (!email || !isEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const { rows } = await pool.query(
      'INSERT INTO users(email) VALUES ($1) RETURNING id, email, created_at;',
      [email.toLowerCase().trim()]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    // 23505 = unique_violation en Postgres
    if (e?.code === '23505') {
      return res.status(409).json({ error: 'Email ya existe' });
    }
    res.status(500).json({ error: e.message });
  }
});
// delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1;', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API listening on http://0.0.0.0:${PORT}`);
});
