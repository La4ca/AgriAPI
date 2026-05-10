import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ── VEHICLES ─────────────────────────────────────────────────────────────────

// GET /api/transportation/vehicles
router.get('/vehicles', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ vehicleId: 1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transportation/vehicles
router.post('/vehicles', protect, async (req, res) => {
  try {
    const { vehicleId, plate, vehicleType, capacity, status } = req.body;
    if (!vehicleId || !plate) return res.status(400).json({ message: 'vehicleId and plate are required.' });
    const exists = await Vehicle.findOne({ vehicleId });
    if (exists) return res.status(400).json({ message: `Vehicle ID "${vehicleId}" already exists.` });
    const vehicle = await Vehicle.create({ vehicleId, plate, vehicleType, capacity, status: status || 'loading', driver: '', phone: '' });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/transportation/vehicles/:id
router.put('/vehicles/:id', protect, async (req, res) => {
  try {
    const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/transportation/vehicles/:id
router.delete('/vehicles/:id', protect, async (req, res) => {
  try {
    const deleted = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/transportation/vehicles/:vehicleId/progress — update live position
router.put('/:id/progress', protect, async (req, res) => {
  try {
    const { progress, lat, lng, speed, fuel } = req.body;
    const updated = await Vehicle.findOneAndUpdate(
      { vehicleId: req.params.id },
      { progress, lat, lng, speed, fuel },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/transportation/:id/status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Vehicle.findOneAndUpdate(
      { vehicleId: req.params.id },
      { status, progress: status === 'delivered' ? 100 : undefined },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── DRIVERS ───────────────────────────────────────────────────────────────────

// GET /api/transportation/drivers
router.get('/drivers', protect, async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transportation/drivers
router.post('/drivers', protect, async (req, res) => {
  try {
    const { name, licenseNo, contact, address, status, vehicleId, plate, vehicleType } = req.body;
    if (!name || !licenseNo) return res.status(400).json({ message: 'Name and license number are required.' });
    const driver = await Driver.create({ name, licenseNo, contact, address, status: status || 'available', vehicleId: vehicleId || '', plate: plate || '', vehicleType: vehicleType || '' });
    res.status(201).json(driver);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/transportation/drivers/:id
router.put('/drivers/:id', protect, async (req, res) => {
  try {
    const updated = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Driver not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/transportation/drivers/:id
router.delete('/drivers/:id', protect, async (req, res) => {
  try {
    const deleted = await Driver.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Driver not found' });
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy: GET /api/transportation (kept for backward compat)
router.get('/', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ vehicleId: 1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
