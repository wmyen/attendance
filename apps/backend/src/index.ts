import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './models/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import leaveRoutes from './routes/leaveRoutes';
import overtimeRoutes from './routes/overtimeRoutes';
import correctionRoutes from './routes/correctionRoutes';

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
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/attendance/corrections', correctionRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
