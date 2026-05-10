import express from 'express';
import Farmer from '../models/Farmer.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const ROLE_PERMISSIONS = {
  admin:      { canView: true, canApprove: true, canAddData: true,  canManageUsers: true  },
  approver:   { canView: true, canApprove: true, canAddData: false, canManageUsers: false },
  data_entry: { canView: true, canApprove: false,canAddData: true,  canManageUsers: false },
  monitor:    { canView: true, canApprove: false,canAddData: false, canManageUsers: false },
};

// helper — works even if req.user.permissions is missing
const canAddData = (user) =>
  user?.permissions?.canAddData ?? ROLE_PERMISSIONS[user?.role]?.canAddData ?? false;

// GET /api/farmers
router.get('/', protect, async (req, res) => {
  try {
    const farmers = await Farmer.find().sort({ createdAt: -1 });
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/farmers
router.post('/', protect, async (req, res) => {
  try {
    if (!canAddData(req.user))
      return res.status(403).json({ message: 'No permission to add data' });

    const { name, location, crops, hectares, contact, status } = req.body;
    const farmer = await Farmer.create({
      name, location,
      crops: Array.isArray(crops) ? crops : crops.split(',').map(c => c.trim()),
      hectares: parseFloat(hectares) || 0,
      contact,
      status: status || 'active',
      lastHarvest: new Date().toISOString().slice(0, 10),
    });
    res.status(201).json(farmer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/farmers/:id
router.put('/:id', protect, async (req, res) => {
  try {
    if (!canAddData(req.user))
      return res.status(403).json({ message: 'No permission to edit data' });

    const { name, location, crops, hectares, contact, status } = req.body;
    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      {
        name, location,
        crops: Array.isArray(crops) ? crops : crops.split(',').map(c => c.trim()),
        hectares: parseFloat(hectares) || 0,
        contact, status,
      },
      { new: true }
    );
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    res.json(farmer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/farmers/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!canAddData(req.user))
      return res.status(403).json({ message: 'No permission to delete data' });

    await Farmer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Farmer deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;