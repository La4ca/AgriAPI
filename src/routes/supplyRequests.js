import express from 'express';
import SupplyRequest from '../models/SupplyRequest.js';
import Activity from '../models/Activity.js';
import Driver from '../models/Driver.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const ROLE_PERMISSIONS = {
  admin:      { canView: true, canApprove: true, canAddData: true,  canManageUsers: true  },
  approver:   { canView: true, canApprove: true, canAddData: false, canManageUsers: false },
  data_entry: { canView: true, canApprove: false,canAddData: true,  canManageUsers: false },
  monitor:    { canView: true, canApprove: false,canAddData: false, canManageUsers: false },
};

const canApprove = (user) =>
  user?.permissions?.canApprove ?? ROLE_PERMISSIONS[user?.role]?.canApprove ?? false;

// GET /api/supply-requests
router.get('/', protect, async (req, res) => {
  try {
    const requests = await SupplyRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/supply-requests
router.post('/', protect, async (req, res) => {
  try {
    const { crop, quantity, from, to, urgency, notes } = req.body;
    const req_ = await SupplyRequest.create({
      submittedBy: req.user.name,
      crop, quantity, from, to,
      urgency: urgency || 'high',
      notes: notes || '',
      status: 'pending',
    });
    await Activity.create({
      type: 'match',
      message: `New supply request: ${crop} from ${from} to ${to}`,
      icon: 'plus',
    });
    res.status(201).json(req_);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/supply-requests/:id/approve
// Body: { vehicleId, vehicleDbId, driverId } — vehicle must be selected from the fleet
router.put('/:id/approve', protect, async (req, res) => {
  try {
    if (!canApprove(req.user))
      return res.status(403).json({ message: 'No permission to approve' });

    const { vehicleId, driverId } = req.body;
    if (!vehicleId || !driverId)
      return res.status(400).json({ message: 'Please select a vehicle with an assigned driver before approving.' });

    // Load the driver to get name, plate, contact, etc.
    const driver = await Driver.findById(driverId);
    if (!driver)
      return res.status(404).json({ message: 'Selected driver not found.' });

    const updated = await SupplyRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'in_transit',
        approvedBy: req.user.name,
        approvedAt: new Date(),
        truckId: vehicleId,
        driver: driver.name,
        plate: driver.plate || '',
        phone: driver.contact || '',
        progress: 0,
        speed: 45,
        lat: 10.5 + (Math.random() - 0.5) * 0.5,
        lng: 123.8 + (Math.random() - 0.5) * 0.3,
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Request not found' });

    // Mark driver as on_duty
    await Driver.findByIdAndUpdate(driverId, { status: 'on_duty' });

    await Activity.create({
      type: 'delivery',
      message: `${updated.crop} shipment approved, en route to ${updated.to}`,
      icon: 'truck',
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/supply-requests/:id/reject
router.put('/:id/reject', protect, async (req, res) => {
  try {
    if (!canApprove(req.user))
      return res.status(403).json({ message: 'No permission to reject' });

    const { reason } = req.body;
    const updated = await SupplyRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectedBy: req.user.name,
        rejectedAt: new Date(),
        rejectReason: reason || '',
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Request not found' });;
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/supply-requests/:id/received
router.put('/:id/received', protect, async (req, res) => {
  try {
    const updated = await SupplyRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'delivered',
        receivedBy: req.user.name,
        receivedAt: new Date(),
        progress: 100,
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Request not found' });
    await Activity.create({
      type: 'delivery',
      message: `${updated.crop} delivery arrived at ${updated.to}`,
      icon: 'truck',
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/supply-requests/:id/progress
router.put('/:id/progress', protect, async (req, res) => {
  try {
    const { progress, lat, lng, speed } = req.body;
    const updated = await SupplyRequest.findByIdAndUpdate(
      req.params.id,
      { progress, lat, lng, speed },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
