import express from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ── Helper: verify a backup code against stored hashes ────────────────────────
// Finds a matching unused backup code, marks it used, saves, returns true/false.
async function verifyBackupCode(user, rawCode) {
  // Normalise: strip whitespace, uppercase
  const normalised = rawCode.replace(/\s/g, '').toUpperCase();
  for (let i = 0; i < user.mfaBackupCodes.length; i++) {
    const entry = user.mfaBackupCodes[i];
    if (entry.used) continue;
    const match = await bcrypt.compare(normalised, entry.hash);
    if (match) {
      user.mfaBackupCodes[i].used = true;
      await user.save();
      return true;
    }
  }
  return false;
}

// ── Helper: is the token a backup code format? (XXXX-XXXX or XXXXXXXX) ────────
function looksLikeBackupCode(token) {
  // 8 digits with optional dash in the middle: "1234-5678" or "12345678"
  return /^\d{4}-\d{4}$/.test(token) || /^\d{8}$/.test(token);
}

// Normalise backup token to "XXXX-XXXX" form for consistent comparison
function normaliseBackupToken(token) {
  const digits = token.replace(/\D/g, '');
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

// GET /api/mfa/status — get current user's MFA status
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ enabled: user.mfaEnabled, remindLater: user.remindMfaLater });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/mfa/setup — generate TOTP secret + QR
router.post('/setup', protect, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `AgriFlow (${req.user.email})`,
      issuer: 'AgriFlow',
    });
    // Store secret temporarily (not yet enabled)
    await User.findByIdAndUpdate(req.user._id, { mfaSecret: secret.base32 });
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qrCode: qrDataUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/mfa/verify-setup — confirm TOTP token and enable MFA
router.post('/verify-setup', protect, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    const valid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!valid) return res.status(400).json({ message: 'Invalid token' });
    await User.findByIdAndUpdate(req.user._id, { mfaEnabled: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/mfa/save-backup-codes — store hashed backup codes after setup
router.post('/save-backup-codes', protect, async (req, res) => {
  try {
    const { codes } = req.body; // array of plain "XXXX-XXXX" strings
    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ message: 'No backup codes provided' });
    }
    // Hash each code before storing
    const hashed = await Promise.all(
      codes.map(async (code) => {
        const normalised = code.replace(/\s/g, '').toUpperCase();
        const hash = await bcrypt.hash(normalised, 10);
        return { hash, used: false };
      })
    );
    await User.findByIdAndUpdate(req.user._id, { mfaBackupCodes: hashed });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/mfa/verify — verify token during login (TOTP or backup code)
router.post('/verify', async (req, res) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if it looks like a backup code
    if (looksLikeBackupCode(token)) {
      const normToken = normaliseBackupToken(token);
      const used = await verifyBackupCode(user, normToken);
      if (!used) return res.status(400).json({ message: 'Invalid or already-used backup code' });
      return res.json({ success: true });
    }

    // Otherwise treat as TOTP
    const valid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!valid) return res.status(400).json({ message: 'Invalid token' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/mfa/verify-and-disable — verify identity (TOTP or backup) before disabling
// Used by MFASettingsPanel's "Disable MFA" flow
router.post('/verify-and-disable', protect, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let valid = false;

    if (looksLikeBackupCode(token)) {
      const normToken = normaliseBackupToken(token);
      valid = await verifyBackupCode(user, normToken);
      if (!valid) return res.status(400).json({ message: 'Invalid or already-used backup code' });
    } else {
      valid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token,
        window: 1,
      });
      if (!valid) return res.status(400).json({ message: 'Invalid token' });
    }

    // Identity confirmed — disable MFA
    await User.findByIdAndUpdate(req.user._id, {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/mfa/remind-later
router.post('/remind-later', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { remindMfaLater: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/mfa/disable — direct disable (no verify, kept for internal use)
router.delete('/disable', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
