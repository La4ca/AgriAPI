import express from 'express';
import PriorityRegion from '../models/PriorityRegion.js';
import Activity from '../models/Activity.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const ROLE_PERMISSIONS = {
  admin:      { canAddData: true  },
  approver:   { canAddData: false },
  data_entry: { canAddData: true  },
  monitor:    { canAddData: false },
};

const canAddData = (user) =>
  user?.permissions?.canAddData ?? ROLE_PERMISSIONS[user?.role]?.canAddData ?? false;

// GET /api/priority
router.get('/', protect, async (req, res) => {
  try {
    const regions = await PriorityRegion.find().sort({ score: -1 });
    res.json(regions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/priority
router.post('/', protect, async (req, res) => {
  try {
    if (!canAddData(req.user))
      return res.status(403).json({ message: 'No permission to add data' });
    const region = await PriorityRegion.create({ ...req.body, isCustom: true });
    await Activity.create({
      type: 'update',
      message: `New region added: ${region.region}`,
      icon: 'refresh',
    });
    res.status(201).json(region);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/priority/:id
router.put('/:id', protect, async (req, res) => {
  try {
    if (!canAddData(req.user))
      return res.status(403).json({ message: 'No permission to edit data' });
    const updated = await PriorityRegion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Region not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/priority/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!canAddData(req.user))
      return res.status(403).json({ message: 'No permission to delete data' });
    const region = await PriorityRegion.findById(req.params.id);
    if (!region) return res.status(404).json({ message: 'Region not found' });
    if (!region.isCustom)
      return res.status(400).json({ message: 'Cannot delete built-in regions' });
    await PriorityRegion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Region removed' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;