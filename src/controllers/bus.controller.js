import Bus from '../models/Bus.js';
import logger from '../config/logger.js';

const norm = (s) => (s || '').trim();

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const geocodeCity = async (city) => {
  const attempts = [`${city}, Karnataka, India`, `${city}, India`, city];
  for (const q of attempts) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in&accept-language=en`,
        { headers: { 'User-Agent': 'busnow-app/1.0' } }
      );
      const data = await res.json();
      const karnataka = data.find(d => d.display_name?.toLowerCase().includes('karnataka'));
      if (karnataka) {
        logger.debug(`Geocoded "${city}" → ${karnataka.lat}, ${karnataka.lon}`);
        return { lat: parseFloat(karnataka.lat), lon: parseFloat(karnataka.lon) };
      }
    } catch (e) { logger.error(`Geocode error for "${city}": ${e.message}`); }
    await new Promise(r => setTimeout(r, 400));
  }
  logger.warn(`Geocode failed for "${city}" — no Karnataka result found`);
  return null;
};

// Sort buses: upcoming from current time first, then wrap around
const sortByUpcoming = (buses) => {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const toMins = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  return [...buses].sort((a, b) => {
    const aM = toMins(a.arrivalTime);
    const bM = toMins(b.arrivalTime);
    // minutes until each bus (wrap around midnight)
    const aUntil = aM >= nowMins ? aM - nowMins : 1440 - nowMins + aM;
    const bUntil = bM >= nowMins ? bM - nowMins : 1440 - nowMins + bM;
    return aUntil - bUntil;
  });
};

export const listBuses = async (req, res) => {
  const from = req.body?.from || req.query?.from;
  const to   = req.body?.to   || req.query?.to;
  const q = { status: 'approved' };
  if (from) q.fromCity = new RegExp(`^${norm(from)}$`, 'i');
  if (to)   q.toCity   = new RegExp(`^${norm(to)}$`, 'i');
  const buses = await Bus.find(q);
  res.json({ buses: sortByUpcoming(buses) });
};

export const createBus = async (req, res) => {
  const { name, fromCity, toCity, arrivalTime, frequency } = req.body;
  if (!fromCity || !toCity || !arrivalTime)
    return res.status(400).json({ message: 'fromCity, toCity and arrivalTime are required' });
  const [fromCoords, toCoords] = await Promise.all([geocodeCity(norm(fromCity)), geocodeCity(norm(toCity))]);
  const bus = await Bus.create({
    name: norm(name), fromCity: norm(fromCity), toCity: norm(toCity),
    fromCoords, toCoords,
    arrivalTime: norm(arrivalTime), frequency: norm(frequency) || 'Every day',
    status: 'approved', createdBy: req.user._id,
  });
  res.status(201).json({ bus });
};

export const updateBus = async (req, res) => {
  const update = { ...req.body };
  if (update.fromCity) update.fromCoords = await geocodeCity(norm(update.fromCity));
  if (update.toCity)   update.toCoords   = await geocodeCity(norm(update.toCity));
  const bus = await Bus.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!bus) return res.status(404).json({ message: 'Bus not found' });
  res.json({ bus });
};

export const deleteBus = async (req, res) => {
  const bus = await Bus.findByIdAndDelete(req.params.id);
  if (!bus) return res.status(404).json({ message: 'Bus not found' });
  res.json({ ok: true });
};

// Simple: geocode searched from & to → find buses where fromCoords ~50km from searched-from AND toCoords ~50km from searched-to
export const nearbyBuses = async (req, res) => {
  const from = norm(req.body?.from);
  const to   = norm(req.body?.to);
  if (!from || !to) return res.status(400).json({ message: 'from and to required' });

  const MAX_KM = 50;
  // Geocode searched cities — one may fail, that's ok
  const [fromCoord, toCoord] = await Promise.all([geocodeCity(from), geocodeCity(to)]);
  if (!fromCoord && !toCoord) return res.json({ suggestions: [] });

  const allBuses = await Bus.find({ status: 'approved', fromCoords: { $ne: null }, toCoords: { $ne: null } }).sort({ arrivalTime: 1 });

  const suggestions = allBuses
    .map(b => ({
      ...b.toObject(),
      fromDist: fromCoord ? Math.round(haversine(fromCoord.lat, fromCoord.lon, b.fromCoords.lat, b.fromCoords.lon)) : null,
      toDist:   toCoord   ? Math.round(haversine(toCoord.lat,   toCoord.lon,   b.toCoords.lat,   b.toCoords.lon))   : null,
    }))
    .filter(b => {
      const bFrom = b.fromCity.toLowerCase().trim();
      const bTo   = b.toCity.toLowerCase().trim();
      const sFrom = from.toLowerCase().trim();
      const sTo   = to.toLowerCase().trim();

      // Reverse route check: if bus fromCity matches searched-to OR bus toCity matches searched-from → exclude
      if (bFrom.includes(sTo) || sTo.includes(bFrom)) return false;
      if (bTo.includes(sFrom) || sFrom.includes(bTo)) return false;

      const fromOk = b.fromDist === null || b.fromDist <= MAX_KM;
      const toOk   = b.toDist   === null || b.toDist   <= MAX_KM;
      return fromOk && toOk;
    });

  res.json({ suggestions: sortByUpcoming(suggestions) });
};

export const popularRoutes = async (_req, res) => {
  const rows = await Bus.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: { from: '$fromCity', to: '$toCity' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
    { $project: { _id: 0, from: '$_id.from', to: '$_id.to', count: 1 } },
  ]);
  res.json({ routes: rows });
};

export const cities = async (_req, res) => {
  const [from, to] = await Promise.all([
    Bus.distinct('fromCity', { status: 'approved' }),
    Bus.distinct('toCity',   { status: 'approved' }),
  ]);
  const set = new Set([...from, ...to].map(c => c.trim()).filter(Boolean));
  res.json({ cities: [...set].sort() });
};
