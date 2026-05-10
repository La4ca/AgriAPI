import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLE_PERMISSIONS = {
  admin:      { canView: true, canApprove: true, canAddData: true,  canManageUsers: true  },
  approver:   { canView: true, canApprove: true, canAddData: false, canManageUsers: false },
  data_entry: { canView: true, canApprove: false,canAddData: true,  canManageUsers: false },
  monitor:    { canView: true, canApprove: false,canAddData: false, canManageUsers: false },
};

// Role-based default module visibility
function getRoleModuleDefaults(role) {
  const base = {
    dashboard: true, liveMap: true,
    priorityScoring: false, surplusMatcher: false, supplyRequests: false,
    alerts: false, farmerRegistry: false, transportation: false,
    reports: false, userManagement: false,
  };
  if (role === 'admin')      return Object.fromEntries(Object.keys(base).map(k => [k, true]));
  if (role === 'approver')   return { ...base, priorityScoring:true, surplusMatcher:true, supplyRequests:true, alerts:true, reports:true };
  if (role === 'data_entry') return { ...base, farmerRegistry:true, supplyRequests:true, alerts:true, priorityScoring:true, transportation:true, reports:true };
  if (role === 'monitor')    return { ...base, priorityScoring:true, alerts:true, transportation:true, reports:true };
  return base;
}

const userSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  username:         { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:         { type: String, required: true, minlength: 6 },
  municipalityCode: { type: String, sparse: true, trim: true },
  role:             { type: String, enum: ['admin','approver','data_entry','monitor'], default: 'monitor' },
  avatar:           { type: String },
  department:       { type: String },
  mfaEnabled:       { type: Boolean, default: false },
  mfaSecret:        { type: String },
  remindMfaLater:   { type: Boolean, default: false },
  // Each entry: { hash: String, used: Boolean }
  mfaBackupCodes:   { type: [{ hash: String, used: { type: Boolean, default: false } }], default: [] },
  // Sub-permissions: per-module overrides saved by admin
  moduleAccess:     { type: Map, of: Boolean, default: () => new Map() },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.mfaSecret;
  delete obj.mfaBackupCodes; // never expose hashed backup codes
  obj.permissions = ROLE_PERMISSIONS[obj.role] || {};

  const roleDefaults = getRoleModuleDefaults(obj.role);
  const stored = obj.moduleAccess instanceof Map
    ? Object.fromEntries(obj.moduleAccess)
    : (obj.moduleAccess || {});
  // Stored overrides win — admin can grant or revoke any module
  obj.moduleAccess = { ...roleDefaults, ...stored };

  return obj;
};

export { ROLE_PERMISSIONS, getRoleModuleDefaults };
export default mongoose.model('User', userSchema);
