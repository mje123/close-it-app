import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getDb } from '../db/init';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'closeit-secret-key';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  licenseNumber: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    const db = getDb();
    const { rows: [existing] } = await db.query('SELECT id FROM users WHERE email = $1', [data.email]);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const hash = await bcrypt.hash(data.password, 10);
    const { rows: [newUser] } = await db.query(
      'INSERT INTO users (email, password_hash, name, license_number) VALUES ($1,$2,$3,$4) RETURNING id',
      [data.email, hash, data.name, data.licenseNumber || null]
    );
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: newUser.id, email: data.email, name: data.name } });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);
    const db = getDb();
    const { rows: [user] } = await db.query('SELECT * FROM users WHERE email = $1', [data.email]);
    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { rows: [user] } = await db.query(
    'SELECT id, email, name, license_number, created_at FROM users WHERE id = $1',
    [req.userId]
  );
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

export default router;
