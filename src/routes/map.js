import express from 'express';
import PriorityRegion from '../models/PriorityRegion.js';
import SupplyRequest from '../models/SupplyRequest.js';
import Farmer from '../models/Farmer.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Known coordinates for Cebu locations — used to plot farmer surplus markers
// and interpolate truck positions between origin and destination
const LOCATION_COORDS = {
  'Carmen':        { lat: 10.5921, lng: 124.0120 },
  'Dalaguete':     { lat: 9.8700,  lng: 123.5400 },
  'Moalboal':      { lat: 9.8200,  lng: 123.4700 },
  'Sogod':         { lat: 10.6700, lng: 124.0000 },
  'Catmon':        { lat: 10.7556, lng: 124.0188 },
  'Badian':        { lat: 9.7900,  lng: 123.4300 },
  'Danao':         { lat: 10.5217, lng: 124.0264 },
  'Danao City':    { lat: 10.5217, lng: 124.0264 },
  'Danao, Cebu':   { lat: 10.5217, lng: 124.0264 },
  'Toledo City':   { lat: 10.3765, lng: 123.6394 },
  'Alcoy':         { lat: 9.7278,  lng: 123.4958 },
  'Alcantara':     { lat: 10.3800, lng: 123.5700 },
  'Naga City':     { lat: 10.2139, lng: 123.7583 },
  'Bogo City':     { lat: 11.0544, lng: 124.0056 },
  'Cebu City':     { lat: 10.3157, lng: 123.8854 },
  'Lapu-Lapu City':{ lat: 10.3103, lng: 124.0131 },
  'Mandaue City':  { lat: 10.3236, lng: 123.9223 },
  'Talisay City':  { lat: 10.2445, lng: 123.8485 },
  'San Fernando':  { lat: 10.1647, lng: 123.7158 },
  'Minglanilla':   { lat: 10.2436, lng: 123.7968 },
  'Consolacion':   { lat: 10.3739, lng: 123.9611 },
  'Barili':        { lat: 10.1194, lng: 123.5328 },
  'Argao':         { lat: 9.8797,  lng: 123.6095 },
  'Oslob':         { lat: 9.5333,  lng: 123.3833 },
  'Samboan':       { lat: 9.5317,  lng: 123.3233 },
};

// Interpolate truck position between origin and destination based on progress
function interpolatePosition(originLat, originLng, destLat, destLng, progress) {
  const t = Math.min(Math.max(progress / 100, 0), 1);
  const jitter = () => (Math.random() - 0.5) * 0.004;
  return {
    lat: originLat + (destLat - originLat) * t + jitter(),
    lng: originLng + (destLng - originLng) * t + jitter(),
  };
}

// Find coords for a location string (handles partial matches like "Danao, Cebu")
function findCoords(locationStr) {
  if (!locationStr) return null;
  // Try exact match first
  if (LOCATION_COORDS[locationStr]) return LOCATION_COORDS[locationStr];
  // Try partial match (e.g. "Danao, Cebu" → "Danao")
  const key = Object.keys(LOCATION_COORDS).find(k =>
    locationStr.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(locationStr.toLowerCase())
  );
  return key ? LOCATION_COORDS[key] : null;
}

// GET /api/map/markers — all live map markers
router.get('/markers', protect, async (req, res) => {
  try {

    // ── 1. Demand markers — from PriorityRegion (real DB) ──────────────────
    const regions = await PriorityRegion.find().lean();
    const demandMarkers = regions
      .filter(r => r.lat && r.lng)
      .map(r => ({
        id:          r._id,
        lat:         r.lat,
        lng:         r.lng,
        type:        'demand',
        label:       r.region,
        urgency:     r.urgency,
        population:  r.population,
        shortage:    r.shortage,
        waterLevel:  r.waterLevel,
        score:       r.score,
        stockLeft:   r.stockLeft,
        stockNeeded: r.stockNeeded,
      }));

    // ── 2. Surplus markers — from real Farmer DB ────────────────────────────
    // Active farmers are plotted as surplus sources using their location name
    // matched against LOCATION_COORDS for lat/lng
    const farmers = await Farmer.find({ status: 'active' }).lean();
    const surplusMarkers = farmers
      .map(f => {
        const coords = findCoords(f.location);
        if (!coords) return null;
        return {
          id:    `sur-${f._id}`,
          lat:   coords.lat + (Math.random() - 0.5) * 0.005, // slight spread if multiple farmers in same location
          lng:   coords.lng + (Math.random() - 0.5) * 0.005,
          type:  'surplus',
          label: f.name,
          crop:  Array.isArray(f.crops) ? f.crops.join(', ') : f.crops,
          qty:   f.hectares ? `~${Math.round(f.hectares * 500)} kg est.` : 'N/A',
          farmer: f.location,
        };
      })
      .filter(Boolean);

    // ── 3. Water station markers — from PriorityRegion.waterLevel (live) ───
    const waterMarkers = regions
      .filter(r => r.waterLevel != null && r.lat && r.lng)
      .map(r => ({
        id:     `wat-${r._id}`,
        lat:    r.lat + 0.008,
        lng:    r.lng + 0.008,
        type:   'water',
        label:  `${r.region} Water`,
        level:  r.waterLevel,
        status: r.waterLevel >= 70 ? 'normal' : r.waterLevel >= 40 ? 'low' : 'critical',
      }));

    // ── 4. Truck markers — from SupplyRequest in_transit (same source as Transportation) ──
    // This is the single source of truth for trucks across LiveMap + Transportation
    const inTransit = await SupplyRequest.find({ status: 'in_transit' }).lean();

    const truckMarkers = await Promise.all(
      inTransit.map(async r => {
        let lat = r.lat;
        let lng = r.lng;

        // If no lat/lng yet, interpolate from known origin/destination coords
        if (!lat || !lng) {
          const origin = findCoords(r.from);
          const dest   = findCoords(r.to);
          if (origin && dest) {
            const pos = interpolatePosition(
              origin.lat, origin.lng,
              dest.lat, dest.lng,
              r.progress || 5
            );
            lat = pos.lat;
            lng = pos.lng;
            // Save the interpolated position back so it persists
            await SupplyRequest.findByIdAndUpdate(r._id, { lat, lng });
          }
        }

        if (!lat || !lng) return null;

        // Advance progress slightly each poll — simulates live movement
        const origin = findCoords(r.from);
        const dest   = findCoords(r.to);
        if (origin && dest) {
          const newProgress = Math.min((r.progress || 0) + Math.random() * 1.2 + 0.5, 100);
          const pos = interpolatePosition(origin.lat, origin.lng, dest.lat, dest.lng, newProgress);
          lat = pos.lat;
          lng = pos.lng;
          await SupplyRequest.findByIdAndUpdate(r._id, {
            progress: newProgress, lat, lng,
          });
        }

        return {
          id:       r._id,
          lat,
          lng,
          type:     'truck',
          label:    r.truckId || `Truck`,
          driver:   r.driver,
          cargo:    r.crop,
          progress: r.progress,
          to:       r.to,
          from:     r.from,
          speed:    r.speed || 45,
          plate:    r.plate,
          reqId:    r.reqId,
          quantity: r.quantity,
        };
      })
    );

    const liveTrucks = truckMarkers.filter(Boolean);

    res.json([...demandMarkers, ...surplusMarkers, ...waterMarkers, ...liveTrucks]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
