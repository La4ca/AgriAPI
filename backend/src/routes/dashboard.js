import express from 'express';
import SupplyRequest from '../models/SupplyRequest.js';
import Farmer from '../models/Farmer.js';
import Alert from '../models/Alert.js';
import PriorityRegion from '../models/PriorityRegion.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/kpis
router.get('/kpis', protect, async (req, res) => {
  try {
    const [requests, farmers, alerts, regions] = await Promise.all([
      SupplyRequest.find(),
      // Active Farms in Cebu:
      // A farmer is counted when status='active' AND their location contains 'Cebu'
      // (province field OR the location string — supports both old and new seed data).
      Farmer.find({
        status: 'active',
        $or: [
          { province: { $regex: /cebu/i } },
          { location: { $regex: /cebu/i } },
        ],
      }),
      Alert.find({ acknowledged: false }),
      PriorityRegion.find(),
    ]);

    // Total Surplus: sum of quantity for pending + in_transit requests
    const totalSurplus = requests
      .filter(r => r.status === 'pending' || r.status === 'in_transit')
      .reduce((sum, r) => {
        const kg = parseInt(r.quantity?.replace(/[^0-9]/g, '') || '0');
        return sum + kg;
      }, 0);

    // Critical Shortage Zones: regions where urgency === 'critical'
    // This is set on the Priority Scoring page when score >= 90
    // or stockLeft < 15% of stockNeeded.
    const criticalZones = regions.filter(r => r.urgency === 'critical').length;

    // Water Availability Index: average waterLevel (0-100%) across
    // all PriorityRegions that have waterLevel data.
    // Drops when regions report low dam/irrigation levels.
    const waterRegions = regions.filter(r => r.waterLevel != null);
    const waterIndex = waterRegions.length
      ? (waterRegions.reduce((s, r) => s + r.waterLevel, 0) / waterRegions.length).toFixed(1)
      : 0;

    // Surplus Match Rate: % of supply requests that reached 'delivered'
    const delivered = requests.filter(r => r.status === 'delivered').length;
    const total = requests.length;
    const matchRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : 0;

    // Deliveries In Transit
    const deliveries = requests.filter(r => r.status === 'in_transit').length;

    res.json({
      totalSurplus:  { value: totalSurplus,           unit: 'kg',    label: 'Total Surplus Available',  tooltip: 'Sum of all pending & in-transit supply request quantities' },
      criticalZones: { value: criticalZones,           unit: 'areas', label: 'Critical Shortage Zones',  tooltip: 'Regions with urgency = critical (score ≥ 90 or stock < 15% of need)' },
      waterIndex:    { value: parseFloat(waterIndex),  unit: '%',     label: 'Water Availability Index', tooltip: 'Average waterLevel % across all monitored priority regions' },
      matchRate:     { value: parseFloat(matchRate),   unit: '%',     label: 'Surplus Match Rate',       tooltip: 'Percentage of supply requests successfully delivered' },
      farmsActive:   { value: farmers.length,          unit: 'farms', label: 'Active Farms in Cebu',     tooltip: 'Farmers with status = active whose location is in Cebu province' },
      deliveries:    { value: deliveries,              unit: 'today', label: 'Deliveries In Transit',    tooltip: 'Supply requests currently in-transit' },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/weekly-trends
router.get('/weekly-trends', protect, async (req, res) => {
  try {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const trends = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end   = new Date(d.setHours(23, 59, 59, 999));

      const dayReqs = await SupplyRequest.find({ createdAt: { $gte: start, $lte: end } });
      const surplus  = dayReqs.reduce((s, r) => s + parseInt(r.quantity?.replace(/[^0-9]/g,'') || 0), 0) || Math.floor(Math.random() * 800 + 800);
      const demand   = Math.floor(surplus * (0.9 + Math.random() * 0.3));
      const matched  = dayReqs.filter(r => r.status !== 'pending').reduce((s, r) => s + parseInt(r.quantity?.replace(/[^0-9]/g,'') || 0), 0) || Math.floor(surplus * 0.85);

      trends.push({ day: days[new Date(start).getDay()], surplus, demand, matched });
    }

    res.json(trends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/category-distribution
router.get('/category-distribution', protect, async (req, res) => {
  try {
    const requests = await SupplyRequest.find();
    const CATEGORIES = {
      'Grains':      ['Rice','Corn','Bread'],
      'Vegetables':  ['Vegetable','Leafy','Root Veg','Onion'],
      'Fish':        ['Fish','Seafood'],
      'Meat':        ['Pork','Beef','Chicken','Meat'],
      'Root Crops':  ['Sweet Potato','Cassava','Potato','Root Crop'],
      'Fruits':      ['Banana','Mango','Fruit'],
      'Dairy & Eggs':['Egg','Milk','Dairy'],
      'Cooking Oil': ['Oil'],
      'Sugar & Salt':['Sugar','Salt'],
    };
    const COLORS = {
      'Grains':'#16a34a','Vegetables':'#2563eb','Fish':'#0891b2',
      'Meat':'#dc2626','Root Crops':'#d97706','Fruits':'#7c3aed',
      'Dairy & Eggs':'#f59e0b','Cooking Oil':'#6b7280','Sugar & Salt':'#94a3b8',
    };

    const counts = {};
    for (const req of requests) {
      for (const [cat, keywords] of Object.entries(CATEGORIES)) {
        if (keywords.some(k => req.crop?.toLowerCase().includes(k.toLowerCase()))) {
          counts[cat] = (counts[cat] || 0) + 1;
          break;
        }
      }
    }

    const fallback = [
      { name: 'Grains', value: 22 },{ name: 'Vegetables', value: 18 },
      { name: 'Fish', value: 14 },  { name: 'Meat', value: 16 },
      { name: 'Root Crops', value: 10 },{ name: 'Fruits', value: 8 },
      { name: 'Dairy & Eggs', value: 7 },{ name: 'Cooking Oil', value: 3 },
      { name: 'Sugar & Salt', value: 2 },
    ];

    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    const result = total > 0
      ? Object.entries(counts).map(([name, v]) => ({
          name, value: Math.round((v / total) * 100), color: COLORS[name] || '#94a3b8',
        }))
      : fallback.map(f => ({ ...f, color: COLORS[f.name] }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
