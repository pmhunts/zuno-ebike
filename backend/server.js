import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { sendWelcomeEmail, sendRideReceiptEmail } from './email.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'zuno_rental_secret_2024';

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ─── Pricing ──────────────────────────────────────────────────────────────────
// Rs. 10 unlock fee + Rs. 3 per km (first 5km), Rs. 2 per km after that
const PRICING = {
  unlockFee: 10,
  ratePerKmBase: 3,       // Rs/km for first 5km
  ratePerKmBeyond: 2,     // Rs/km beyond 5km
  baseKmThreshold: 5,
  minFare: 15,            // minimum charge per ride
  currency: 'Rs.'
};

function calculateFare(distanceKm) {
  if (distanceKm <= 0) return PRICING.minFare;
  let fare = PRICING.unlockFee;
  if (distanceKm <= PRICING.baseKmThreshold) {
    fare += distanceKm * PRICING.ratePerKmBase;
  } else {
    fare += PRICING.baseKmThreshold * PRICING.ratePerKmBase;
    fare += (distanceKm - PRICING.baseKmThreshold) * PRICING.ratePerKmBeyond;
  }
  return Math.max(Math.round(fare), PRICING.minFare);
}

// ─── Haversine distance ────────────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ─── Stations ─────────────────────────────────────────────────────────────────
const stations = [
  { id: 'ST01', name: 'MG Road Metro',       city: 'Bangalore', lat: 12.9752, lng: 77.6069, bikeCount: 8  },
  { id: 'ST02', name: 'Koramangala Hub',      city: 'Bangalore', lat: 12.9352, lng: 77.6245, bikeCount: 5  },
  { id: 'ST03', name: 'Indiranagar Station',  city: 'Bangalore', lat: 12.9784, lng: 77.6408, bikeCount: 6  },
  { id: 'ST04', name: 'Whitefield Gate',      city: 'Bangalore', lat: 12.9698, lng: 77.7499, bikeCount: 4  },
  { id: 'ST05', name: 'Jayanagar 4th Block',  city: 'Bangalore', lat: 12.9254, lng: 77.5938, bikeCount: 7  },
  { id: 'ST06', name: 'Electronic City',      city: 'Bangalore', lat: 12.8456, lng: 77.6603, bikeCount: 10 },
  { id: 'ST07', name: 'Andheri West',         city: 'Mumbai',    lat: 19.1197, lng: 72.8464, bikeCount: 9  },
  { id: 'ST08', name: 'Bandra Kurla Complex', city: 'Mumbai',    lat: 19.0596, lng: 72.8656, bikeCount: 7  },
  { id: 'ST09', name: 'Dadar Station',        city: 'Mumbai',    lat: 19.0176, lng: 72.8429, bikeCount: 6  },
  { id: 'ST10', name: 'Powai Lake',           city: 'Mumbai',    lat: 19.1215, lng: 72.9069, bikeCount: 5  },
  { id: 'ST11', name: 'Connaught Place',      city: 'Delhi',     lat: 28.6315, lng: 77.2167, bikeCount: 8  },
  { id: 'ST12', name: 'Hauz Khas',            city: 'Delhi',     lat: 28.5494, lng: 77.2001, bikeCount: 6  },
  { id: 'ST13', name: 'Lajpat Nagar',         city: 'Delhi',     lat: 28.5672, lng: 77.2435, bikeCount: 5  },
  { id: 'ST14', name: 'Sector 18 Noida',      city: 'Delhi',     lat: 28.5705, lng: 77.3219, bikeCount: 4  },
  { id: 'ST15', name: 'Hinjewadi Phase 1',    city: 'Pune',      lat: 18.5912, lng: 73.7390, bikeCount: 7  },
  { id: 'ST16', name: 'Shivajinagar',         city: 'Pune',      lat: 18.5308, lng: 73.8475, bikeCount: 6  },
  { id: 'ST17', name: 'Kothrud',              city: 'Pune',      lat: 18.5074, lng: 73.8077, bikeCount: 5  },
];

// ─── In-memory DB ──────────────────────────────────────────────────────────────
const db = { users: [], rides: [] };

// Seed wallets for demo
db.users.push({
  id: 'demo-user-1',
  name: 'Demo User',
  email: 'demo@zuno.in',
  password: await bcrypt.hash('demo123', 10),
  phone: '+91 9876543210',
  walletBalance: 200,
  createdAt: new Date().toISOString(),
});

// ─── Auth middleware ───────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired token' }); }
};

// ─── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const user = {
    id: uuidv4(), name, email,
    password: await bcrypt.hash(password, 12),
    phone: phone || '',
    walletBalance: 100,   // Rs.100 free credit on signup
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  // Send welcome email — non-blocking, errors are logged not thrown
  sendWelcomeEmail(user).catch(err => console.error('[EMAIL] Welcome email failed:', err.message));
  res.status(201).json({ token, user: sanitize(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: sanitize(user) });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(sanitize(user));
});

// ─── Wallet ────────────────────────────────────────────────────────────────────
app.post('/api/wallet/topup', auth, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 50 || amount > 5000) return res.status(400).json({ error: 'Amount must be between Rs.50 and Rs.5000' });
  const user = db.users.find(u => u.id === req.user.id);
  user.walletBalance += Number(amount);
  res.json({ balance: user.walletBalance, message: `Rs.${amount} added to wallet` });
});

// ─── Stations ─────────────────────────────────────────────────────────────────
app.get('/api/stations', (req, res) => {
  const { city } = req.query;
  let result = stations.map(s => ({
    ...s,
    bikeCount: getLiveCount(s.id)
  }));
  if (city) result = result.filter(s => s.city.toLowerCase() === city.toLowerCase());
  res.json(result);
});

app.get('/api/stations/:id', (req, res) => {
  const station = stations.find(s => s.id === req.params.id);
  if (!station) return res.status(404).json({ error: 'Station not found' });
  res.json({ ...station, bikeCount: getLiveCount(station.id) });
});

function getLiveCount(stationId) {
  const s = stations.find(st => st.id === stationId);
  if (!s) return 0;
  // subtract active rides from this station
  const active = db.rides.filter(r => r.status === 'active' && r.pickupStationId === stationId).length;
  return Math.max(0, s.bikeCount - active);
}

// ─── Fare estimate ─────────────────────────────────────────────────────────────
app.get('/api/fare/estimate', (req, res) => {
  const { fromId, toId } = req.query;
  const from = stations.find(s => s.id === fromId);
  const to = stations.find(s => s.id === toId);
  if (!from || !to) return res.status(400).json({ error: 'Invalid station IDs' });
  const distanceKm = parseFloat(haversineKm(from.lat, from.lng, to.lat, to.lng).toFixed(2));
  const fare = calculateFare(distanceKm);
  const durationMinutes = Math.round((distanceKm / 18) * 60); // avg 18 km/h on ebike
  res.json({ distanceKm, fare, durationMinutes, breakdown: { unlockFee: PRICING.unlockFee, distanceCharge: fare - PRICING.unlockFee, total: fare } });
});

// ─── Start ride ────────────────────────────────────────────────────────────────
app.post('/api/rides/start', auth, (req, res) => {
  const { pickupStationId } = req.body;
  if (!pickupStationId) return res.status(400).json({ error: 'Pickup station is required' });

  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Check for existing active ride
  const existing = db.rides.find(r => r.userId === req.user.id && r.status === 'active');
  if (existing) return res.status(409).json({ error: 'You already have an active ride', rideId: existing.id });

  const station = stations.find(s => s.id === pickupStationId);
  if (!station) return res.status(404).json({ error: 'Station not found' });

  if (getLiveCount(pickupStationId) < 1) return res.status(400).json({ error: 'No bikes available at this station right now' });

  if (user.walletBalance < PRICING.unlockFee) return res.status(400).json({ error: `Insufficient wallet balance. Minimum Rs.${PRICING.unlockFee} required to start a ride.` });

  const bikeNumber = `ZN-${Math.floor(1000 + Math.random() * 9000)}`;
  const ride = {
    id: uuidv4(),
    userId: req.user.id,
    bikeNumber,
    pickupStationId,
    pickupStationName: station.name,
    pickupCity: station.city,
    pickupLat: station.lat,
    pickupLng: station.lng,
    dropStationId: null,
    dropStationName: null,
    status: 'active',
    startedAt: new Date().toISOString(),
    endedAt: null,
    distanceKm: null,
    fare: null,
  };
  db.rides.push(ride);
  res.status(201).json({ ride, message: `Bike ${bikeNumber} unlocked. Ride started!` });
});

// ─── End ride ──────────────────────────────────────────────────────────────────
app.post('/api/rides/:id/end', auth, (req, res) => {
  const { dropStationId } = req.body;
  if (!dropStationId) return res.status(400).json({ error: 'Drop station is required' });

  const ride = db.rides.find(r => r.id === req.params.id && r.userId === req.user.id);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.status !== 'active') return res.status(400).json({ error: 'Ride is not active' });

  const dropStation = stations.find(s => s.id === dropStationId);
  if (!dropStation) return res.status(404).json({ error: 'Drop station not found' });

  const user = db.users.find(u => u.id === req.user.id);

  // Calculate real distance using haversine
  const rawDistance = haversineKm(ride.pickupLat, ride.pickupLng, dropStation.lat, dropStation.lng);
  const distanceKm = parseFloat(rawDistance.toFixed(2));
  const fare = calculateFare(distanceKm);
  const startedAt = new Date(ride.startedAt);
  const endedAt = new Date();
  const durationMinutes = Math.round((endedAt - startedAt) / 60000);

  // Deduct fare
  if (user.walletBalance < fare) {
    // Allow completing ride but flag it
    user.walletBalance = 0;
  } else {
    user.walletBalance -= fare;
  }

  // Update ride
  ride.dropStationId = dropStationId;
  ride.dropStationName = dropStation.name;
  ride.dropLat = dropStation.lat;
  ride.dropLng = dropStation.lng;
  ride.status = 'completed';
  ride.endedAt = endedAt.toISOString();
  ride.distanceKm = distanceKm;
  ride.durationMinutes = durationMinutes;
  ride.fare = fare;
  ride.fareBreakdown = {
    unlockFee: PRICING.unlockFee,
    distanceCharge: fare - PRICING.unlockFee,
    total: fare
  };

  // Send ride receipt email — non-blocking
  sendRideReceiptEmail(user, ride).catch(err => console.error('[EMAIL] Receipt email failed:', err.message));

  res.json({ ride, walletBalance: user.walletBalance, message: `Ride complete. Rs.${fare} charged.` });
});

// ─── Ride history ─────────────────────────────────────────────────────────────
app.get('/api/rides', auth, (req, res) => {
  const userRides = db.rides
    .filter(r => r.userId === req.user.id)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  res.json(userRides);
});

app.get('/api/rides/active', auth, (req, res) => {
  const active = db.rides.find(r => r.userId === req.user.id && r.status === 'active');
  res.json(active || null);
});

app.get('/api/rides/:id', auth, (req, res) => {
  const ride = db.rides.find(r => r.id === req.params.id && r.userId === req.user.id);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  res.json(ride);
});

// ─── Pricing info ──────────────────────────────────────────────────────────────
app.get('/api/pricing', (req, res) => res.json(PRICING));

// ─── Cities ────────────────────────────────────────────────────────────────────
app.get('/api/cities', (req, res) => {
  const cities = [...new Set(stations.map(s => s.city))];
  res.json(cities);
});

// ─── Newsletter ────────────────────────────────────────────────────────────────
const newsletterList = [];
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (newsletterList.find(e => e === email)) return res.status(409).json({ error: 'Already subscribed' });
  newsletterList.push(email);
  res.status(201).json({ success: true, message: 'Subscribed successfully.' });
});

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

function sanitize(user) {
  const { password, ...safe } = user;
  return safe;
}

app.listen(PORT, () => console.log(`Zuno Rental API running on http://localhost:${PORT}`));

// ─── Newsletter (added) ────────────────────────────────────────────────────────
// Already handled above — adding in case it was missed
