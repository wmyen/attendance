import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './models/db';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    conn.release();
    res.json({ success: true, message: 'DB connected' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'DB connection failed', error: String(err) });
  }
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
