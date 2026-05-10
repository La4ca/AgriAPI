import express from 'express';
import User from '../models/User.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

const ROLE_PERMISSIONS = {
  admin:      { canView: true, canApprove: true, canAddData: true,  canManageUsers: true  },
  approver:   { canView: true, canApprove: true, canAddData: false, canManageUsers: false },
  data_entry: { canView: true, canApprove: false,canAddData: true,  canManageUsers: false },
  monitor:    { canView: true, canApprove: false,canAddData: false, canManageUsers: false },
};

// GET /api/users - list all users (admin only)
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password -mfaSecret').lean();
    const withPerms = users.map(u => ({ ...u, permissions: ROLE_PERMISSIONS[u.role] || {} }));
    res.json(withPerms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users - create user (admin only)
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department, municipalityCode } = req.body;

    if (!name || !email || !password || !municipalityCode)
      return res.status(400).json({ message: 'Name, email, password, and municipality code are required.' });

    const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const user = await User.create({ name, email, password, role, department, municipalityCode, avatar });
    res.status(201).json(user.toSafeObject());
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Email already exists.' });
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/users/:id - update user (admin only)
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { role, department, name, municipalityCode, moduleAccess } = req.body;
    const updateFields = { role, department, name, municipalityCode };
    // Persist module-level sub-permission overrides if provided
    if (moduleAccess && typeof moduleAccess === 'object') {
      updateFields.moduleAccess = moduleAccess;
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).select('-password -mfaSecret');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/users/:id/reset-password - reset to default password (admin only)
// Default format: firstName (lowercase) + first 4 chars of municipalityCode (digits only)
router.post('/:id/reset-password', protect, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const firstName = user.name.trim().split(/\s+/)[0].toLowerCase();
    const digits = (user.municipalityCode || '').replace(/\D/g, '');
    const newPassword = firstName + digits.slice(0, 4);

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Generated password is too short. Ensure the municipality code has at least 4 digits.' });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.json({ message: 'Password reset successfully.', generatedPassword: newPassword });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/users/:id (admin only)
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;