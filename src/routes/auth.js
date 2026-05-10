import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, municipalityCode } = req.body;
    if (!name || !username || !email || !password || !municipalityCode)
      return res.status(400).json({ message: 'All fields are required.' });

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email is already registered.' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username is already taken.' });

    const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const user = await User.create({ name, username, email, password, municipalityCode, avatar, role: 'monitor' });

    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, municipalityCode } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });
    if (!municipalityCode)
      return res.status(400).json({ message: 'Municipality code is required.' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password.' });

    // Verify municipality code matches the account
    if (user.municipalityCode.toUpperCase() !== municipalityCode.trim().toUpperCase())
      return res.status(403).json({ message: 'Municipality code does not match this account.' });

    const safeUser = user.toSafeObject();
    const token = signToken(user._id);

    res.json({
      success: true,
      token,
      user: safeUser,
      mfaEnabled: user.mfaEnabled,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me - verify token and return current user
router.get('/me', protect, async (req, res) => {
  res.json(req.user.toSafeObject());
});

// POST /api/auth/complete-login - called after MFA verification
router.post('/complete-login', protect, async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

export default router;
