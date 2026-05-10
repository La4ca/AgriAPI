import express from 'express';
import Alert from '../models/Alert.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/alerts
router.get('/', protect, async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/alerts
router.post('/', protect, async (req, res) => {
  try {
    const { type, title, message, region, lat, lng } = req.body;
    const alert = await Alert.create({ type, title, message, region, lat, lng });
    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/alerts/:id/acknowledge
router.put('/:id/acknowledge', protect, async (req, res) => {
  try {
    const updated = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        acknowledged: true,
        acknowledgedBy: req.user.name,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Alert not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert dismissed' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;