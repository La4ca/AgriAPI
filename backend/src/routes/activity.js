import express from 'express';
import Activity from '../models/Activity.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/activity
router.get('/', protect, async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(20);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
