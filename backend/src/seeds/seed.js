import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import SupplyRequest from '../models/SupplyRequest.js';
import Alert from '../models/Alert.js';
import PriorityRegion from '../models/PriorityRegion.js';
import Vehicle from '../models/Vehicle.js';
import Activity from '../models/Activity.js';

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas');

  // Clear existing data
  await Promise.all([
    User.deleteMany(),
    Farmer.deleteMany(),
    SupplyRequest.deleteMany(),
    Alert.deleteMany(),
    PriorityRegion.deleteMany(),
    Vehicle.deleteMany(),
    Activity.deleteMany(),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Users ──────────────────────────────────────────────────────────────────
  await User.create([
    { name: 'Laica Cabatana', email: 'admin@agriflow.ph',     password: 'admin123',   role: 'admin',      avatar: 'LC', department: 'System Administration' },
    { name: 'Shyna Labay',    email: 'monitor@agriflow.ph',   password: 'monitor123', role: 'monitor',    avatar: 'SL', department: 'Field Monitoring' },
    { name: 'Seth Canencia',  email: 'approver@agriflow.ph',  password: 'approve123', role: 'approver',   avatar: 'SC', department: 'Logistics & Approval' },
    { name: 'Joshua Arcilla', email: 'dataentry@agriflow.ph', password: 'data123',    role: 'data_entry', avatar: 'JA', department: 'Data Management' },
  ]);
  console.log('👤 Users seeded');

  // ── Farmers ────────────────────────────────────────────────────────────────
  await Farmer.create([
    { name: 'Junalyn Echavez',  location: 'Carmen, Cebu',    province: 'Cebu',    crops: ['Corn','Vegetables'],       hectares: 4.5, status: 'active',   lastHarvest: '2025-02-28', contact: '+63-917-111-2233' },
    { name: 'Laica Cabatana',   location: 'Badian, Cebu',    province: 'Cebu',    crops: ['Root Crops','Fruits'],      hectares: 3.2, status: 'active',   lastHarvest: '2025-03-01', contact: '+63-917-222-3344' },
    { name: 'Shyna Labay',      location: 'Moalboal, Cebu',  province: 'Cebu',  crops: ['Fish','Seaweed'],           hectares: 2.1, status: 'active',   lastHarvest: '2025-03-05', contact: '+63-917-333-4455' },
    { name: 'Vincent Dumaguet', location: 'Sogod, Cebu',     province: 'Cebu',     crops: ['Vegetables','Herbs'],       hectares: 1.8, status: 'active',   lastHarvest: '2025-03-02', contact: '+63-917-444-5566' },
    { name: 'Seth Canencia',    location: 'Catmon, Cebu',    province: 'Cebu',    crops: ['Rice','Coconut'],           hectares: 6.7, status: 'active',   lastHarvest: '2025-02-20', contact: '+63-917-555-6677' },
    { name: 'Joshua Arcilla',   location: 'Dalaguete, Cebu', province: 'Cebu', crops: ['Sweet Potato','Corn'],      hectares: 2.9, status: 'active',   lastHarvest: '2025-03-04', contact: '+63-917-666-7788' },
    { name: 'Kimmuel Dano',     location: 'Toledo, Cebu',    province: 'Cebu',    crops: ['Vegetables'],               hectares: 1.5, status: 'inactive', lastHarvest: '2025-01-15', contact: '+63-917-777-8899' },
    { name: 'Anne Pardillo',    location: 'Danao, Cebu',     province: 'Cebu',     crops: ['Fruits','Vegetables'],      hectares: 3.8, status: 'active',   lastHarvest: '2025-03-03', contact: '+63-917-888-9900' },
  ]);
  console.log('🌾 Farmers seeded');

  // ── Priority Regions ───────────────────────────────────────────────────────
  await PriorityRegion.create([
    { region: 'Toledo City',    area: 'Western Cebu',   score: 95, urgency: 'critical', population: '188K', shortage: 'Rice, Vegetables',      lastUpdated: '1 hour ago',   lat: 10.3765, lng: 123.6394, waterLevel: 45, stockLeft: 120,  stockNeeded: 2400 },
    { region: 'Alcoy',          area: 'Southern Cebu',  score: 91, urgency: 'critical', population: '18K',  shortage: 'All Staples',            lastUpdated: '2 hours ago',  lat: 9.7278,  lng: 123.4958, waterLevel: 38, stockLeft: 45,   stockNeeded: 800  },
    { region: 'Dalaguete',      area: 'Southern Cebu',  score: 89, urgency: 'critical', population: '54K',  shortage: 'Rice, Corn, Fish',       lastUpdated: '3 hours ago',  lat: 9.7628,  lng: 123.5344, waterLevel: 42, stockLeft: 210,  stockNeeded: 1600 },
    { region: 'Bogo City',      area: 'Northern Cebu',  score: 86, urgency: 'critical', population: '96K',  shortage: 'Vegetables, Dairy',      lastUpdated: '1 hour ago',   lat: 11.0544, lng: 124.0056, waterLevel: 52, stockLeft: 380,  stockNeeded: 2100 },
    { region: 'Danao City',     area: 'North Cebu',     score: 81, urgency: 'high',     population: '171K', shortage: 'Fruits, Pulses',         lastUpdated: '4 hours ago',  lat: 10.5217, lng: 124.0264, waterLevel: 61, stockLeft: 540,  stockNeeded: 1800 },
    { region: 'Naga City',      area: 'Southern Metro', score: 78, urgency: 'high',     population: '112K', shortage: 'Root Crops, Vegetables', lastUpdated: '5 hours ago',  lat: 10.2139, lng: 123.7583, waterLevel: 65, stockLeft: 620,  stockNeeded: 1500 },
    { region: 'Catmon',         area: 'Northern Cebu',  score: 74, urgency: 'high',     population: '35K',  shortage: 'Rice, Coconut Products', lastUpdated: '6 hours ago',  lat: 10.7203, lng: 124.0130, waterLevel: 58, stockLeft: 290,  stockNeeded: 900  },
    { region: 'Cebu City',      area: 'Metro Cebu',     score: 65, urgency: 'moderate', population: '964K', shortage: 'Vegetables, Fish',       lastUpdated: '2 hours ago',  lat: 10.3157, lng: 123.8854, waterLevel: 72, stockLeft: 2100, stockNeeded: 4200 },
    { region: 'Lapu-Lapu City', area: 'Metro Cebu',     score: 62, urgency: 'moderate', population: '497K', shortage: 'Vegetables, Grains',     lastUpdated: '3 hours ago',  lat: 10.3103, lng: 123.9494, waterLevel: 74, stockLeft: 1400, stockNeeded: 2800 },
    { region: 'Mandaue City',   area: 'Metro Cebu',     score: 58, urgency: 'moderate', population: '364K', shortage: 'Fresh Produce',          lastUpdated: '4 hours ago',  lat: 10.3236, lng: 123.9223, waterLevel: 70, stockLeft: 980,  stockNeeded: 1900 },
    { region: 'Talisay City',   area: 'South Metro',    score: 50, urgency: 'moderate', population: '248K', shortage: 'Fruits, Vegetables',     lastUpdated: '7 hours ago',  lat: 10.2447, lng: 123.8485, waterLevel: 68, stockLeft: 760,  stockNeeded: 1200 },
    { region: 'San Fernando',   area: 'Southern Cebu',  score: 39, urgency: 'low',      population: '94K',  shortage: 'Seasonal shortfall',     lastUpdated: '10 hours ago', lat: 10.1614, lng: 123.7083, waterLevel: 80, stockLeft: 1100, stockNeeded: 1400 },
    { region: 'Minglanilla',    area: 'South Metro',    score: 35, urgency: 'low',      population: '111K', shortage: 'Minor deficit',          lastUpdated: '12 hours ago', lat: 10.2444, lng: 123.7993, waterLevel: 78, stockLeft: 1250, stockNeeded: 1500 },
    { region: 'Consolacion',    area: 'North Metro',    score: 30, urgency: 'low',      population: '134K', shortage: 'Minimal shortage',       lastUpdated: '14 hours ago', lat: 10.3747, lng: 123.9575, waterLevel: 82, stockLeft: 1600, stockNeeded: 1800 },
    { region: 'Carmen',         area: 'Central Cebu',   score: 28, urgency: 'low',      population: '80K',  shortage: 'None significant',       lastUpdated: '1 day ago',    lat: 10.5921, lng: 124.0120, waterLevel: 85, stockLeft: 1900, stockNeeded: 1900 },
  ]);
  console.log('📍 Priority regions seeded');

  // ── Supply Requests ────────────────────────────────────────────────────────
  const requests = await SupplyRequest.insertMany([
    { reqId:'REQ-001', submittedBy:'Carlo Mendoza', crop:'Rice & Vegetables', quantity:'500 kg',   from:'Carmen',    to:'Toledo City', urgency:'critical', status:'pending',    notes:'Urgent — stock at Toledo depleted',          matchScore:97, distance:'72 km' },
    { reqId:'REQ-002', submittedBy:'Carlo Mendoza', crop:'Sweet Potato',      quantity:'300 kg',   from:'Dalaguete', to:'Alcoy',        urgency:'critical', status:'pending',    notes:'Critical shortage in Alcoy',                  matchScore:93, distance:'18 km' },
    { reqId:'REQ-005', submittedBy:'Carlo Mendoza', crop:'Fresh Fish',        quantity:'420 kg',   from:'Moalboal',  to:'Naga City',   urgency:'high',     status:'pending',    notes:'Moalboal fishers have surplus stock',         matchScore:86, distance:'58 km' },
    { reqId:'REQ-006', submittedBy:'Carlo Mendoza', crop:'Vegetables Mix',    quantity:'2,100 kg', from:'Sogod',     to:'Danao City',  urgency:'high',     status:'pending',    notes:'Sogod cooperative has large vegetable surplus',matchScore:82, distance:'64 km' },
    { reqId:'REQ-007', submittedBy:'Carlo Mendoza', crop:'Root Crops',        quantity:'1,400 kg', from:'Badian',    to:'Dalaguete',   urgency:'moderate', status:'pending',    notes:'Badian Valley farm surplus roots',            matchScore:88, distance:'42 km' },
    { reqId:'REQ-003', submittedBy:'Carlo Mendoza', crop:'Fresh Vegetables',  quantity:'800 kg',   from:'Sogod',     to:'Danao City',  urgency:'high',     status:'in_transit', notes:'Regular supply run',  approvedBy:'Ana Reyes', truckId:'TRK-07', driver:'Jun Apostol',     plate:'CEB-6789', lat:10.4300, lng:123.9800, progress:45 },
    { reqId:'REQ-008', submittedBy:'Carlo Mendoza', crop:'Rice & Coconut',    quantity:'3,200 kg', from:'Catmon',    to:'Bogo City',   urgency:'high',     status:'in_transit', notes:'Northern Harvest Co. dispatch', approvedBy:'Ana Reyes', truckId:'TRK-A', driver:'Ernesto Labrador', plate:'CEB-1234', lat:10.7000, lng:124.0100, progress:60 },
    { reqId:'REQ-004', submittedBy:'Carlo Mendoza', crop:'Coconut Products',  quantity:'1,200 kg', from:'Catmon',    to:'Bogo City',   urgency:'high',     status:'delivered',  notes:'', approvedBy:'Ana Reyes', receivedBy:'Ana Reyes', matchScore:88, distance:'35 km' },
  ]);
  console.log('📦 Supply requests seeded');

  // ── Alerts ─────────────────────────────────────────────────────────────────
  await Alert.create([
    { type:'critical', title:'Severe Shortage — Toledo City',   message:'Rice stock depleted. Estimated 48hr shortage window. Immediate dispatch required.',          region:'Toledo City', acknowledged:false },
    { type:'critical', title:'Water Level Critical — Naga Dam', message:'Naga Dam at 48% capacity. Irrigation impact for 3 southern municipalities expected.',        region:'Naga City',   acknowledged:false },
    { type:'high',     title:'Bogo City Vegetable Deficit',     message:'Vegetable supply down 62%. Prioritize redistribution from Carmen surplus pool.',             region:'Bogo City',   acknowledged:true  },
    { type:'high',     title:'Delayed Delivery — Danao Route',  message:'Truck #3 delayed due to road conditions. ETA extended by 4 hours.',                          region:'Danao City',  acknowledged:true  },
    { type:'moderate', title:'Cebu City Market Price Spike',    message:'Vegetable prices up 18% vs. last week. Increased demand from urban centers.',                region:'Cebu City',   acknowledged:true  },
    { type:'low',      title:'Minglanilla Stock Update',        message:'Minor seasonal shortfall detected. Normal replenishment cycle expected.',                    region:'Minglanilla', acknowledged:true  },
  ]);
  console.log('🚨 Alerts seeded');

  // ── Vehicles ───────────────────────────────────────────────────────────────
  await Vehicle.create([
    { vehicleId:'TRK-01', driver:'Ernesto Labrador', plate:'CEB-1234', phone:'+63-917-001-1111', cargo:'Rice & Corn',        weight:'1,800 kg', from:'Carmen',    to:'Toledo City',  status:'in_transit', progress:62, lat:10.4820, lng:123.7800, speed:48, fuel:74, eta:'42 min' },
    { vehicleId:'TRK-02', driver:'Remy Cabañas',     plate:'CEB-5678', phone:'+63-917-002-2222', cargo:'Sweet Potato',       weight:'950 kg',   from:'Dalaguete', to:'Alcoy',         status:'in_transit', progress:78, lat:9.7430,  lng:123.5100, speed:35, fuel:52, eta:'18 min' },
    { vehicleId:'TRK-03', driver:'Mario Suarez',     plate:'CEB-9012', phone:'+63-917-003-3333', cargo:'Rice & Coconut',     weight:'3,200 kg', from:'Catmon',    to:'Bogo City',     status:'in_transit', progress:45, lat:10.8900, lng:124.0100, speed:55, fuel:88, eta:'28 min' },
    { vehicleId:'TRK-04', driver:'Lito Fuentes',     plate:'CEB-3456', phone:'+63-917-004-4444', cargo:'Fresh Fish',         weight:'420 kg',   from:'Moalboal',  to:'Naga City',     status:'loading',    progress:0,  lat:9.8200,  lng:123.4700, speed:0,  fuel:90, eta:'Pending' },
    { vehicleId:'TRK-05', driver:'Cora Dela Peña',   plate:'CEB-7890', phone:'+63-917-005-5555', cargo:'Vegetables Mix',     weight:'2,100 kg', from:'Sogod',     to:'Danao City',    status:'loading',    progress:0,  lat:10.6700, lng:124.0000, speed:0,  fuel:65, eta:'Pending' },
    { vehicleId:'TRK-06', driver:'Ben Magallanes',   plate:'CEB-2345', phone:'+63-917-006-6666', cargo:'Root Crops',         weight:'1,400 kg', from:'Badian',    to:'Dalaguete',     status:'delivered',  progress:100,lat:9.7628,  lng:123.5344, speed:0,  fuel:41, eta:'Delivered' },
    { vehicleId:'TRK-07', driver:'Jun Aol',          plate:'CEB-6789', phone:'+63-917-007-7777', cargo:'Fruits & Vegetables',weight:'1,100 kg', from:'Danao',     to:'Cebu City',     status:'in_transit', progress:30, lat:10.4300, lng:123.9800, speed:62, fuel:79, eta:'55 min' },
  ]);
  console.log('🚚 Vehicles seeded');

  // ── Activity Feed ──────────────────────────────────────────────────────────
  await Activity.create([
    { type:'match',    message:'Corn surplus from Carmen matched to Toledo City',          icon:'link'    },
    { type:'alert',    message:'Critical water level alert — Naga Dam at 48%',            icon:'alert'   },
    { type:'delivery', message:'Sweet potato shipment en route to Alcoy',                 icon:'truck'   },
    { type:'update',   message:'Priority scores updated for 5 southern municipalities',   icon:'refresh' },
    { type:'match',    message:'Northern Harvest Co. surplus matched to Bogo City',       icon:'plus'    },
    { type:'delivery', message:'Fish delivery arrived at Naga City community hub',        icon:'truck'   },
    { type:'alert',    message:'Shortage elevated to CRITICAL in Toledo City',            icon:'alert'   },
  ]);
  console.log('📝 Activity feed seeded');

  console.log('\n✅ Database seeded successfully!\n');
  console.log('Demo credentials:');
  console.log('  admin@agriflow.ph     / admin123');
  console.log('  monitor@agriflow.ph   / monitor123');
  console.log('  approver@agriflow.ph  / approve123');
  console.log('  dataentry@agriflow.ph / data123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
