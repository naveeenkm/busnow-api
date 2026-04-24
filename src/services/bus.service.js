import Bus from '../models/Bus.js';
import { logInfo, logWarn, logError, logDebug } from '../config/logger.js';
import {
  BUS_STATUS_APPROVED, DEFAULT_FREQUENCY, NEARBY_MAX_KM, POPULAR_ROUTES_LIMIT,
  GEOCODE_DELAY_MS, GEOCODE_RESULT_LIMIT, GEOCODE_USER_AGENT, GEOCODE_STATE, GEOCODE_COUNTRY,
} from '../constants/index.js';

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

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
    const aUntil = aM >= nowMins ? aM - nowMins : 1440 - nowMins + aM;
    const bUntil = bM >= nowMins ? bM - nowMins : 1440 - nowMins + bM;
    return aUntil - bUntil;
  });
};

export const geocodeCity = async (city) => {
  logDebug('Service:geocodeCity - Processing request', { city });
  const attempts = [`${city}, Karnataka, India`, `${city}, India`, city];
  for (const q of attempts) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=${GEOCODE_RESULT_LIMIT}&countrycodes=${GEOCODE_COUNTRY}&accept-language=en`,
        { headers: { 'User-Agent': GEOCODE_USER_AGENT } }
      );
      const data = await res.json();
      const match = data.find(d => d.display_name?.toLowerCase().includes(GEOCODE_STATE));
      if (match) {
        logDebug('Service:geocodeCity - Success', { city, lat: match.lat, lon: match.lon });
        return { lat: parseFloat(match.lat), lon: parseFloat(match.lon) };
      }
    } catch (e) { logError('Service:geocodeCity - Fetch failed', { city, error: e.message }); }
    await new Promise(r => setTimeout(r, GEOCODE_DELAY_MS));
  }
  logWarn('Service:geocodeCity - No result found', { city });
  return null;
};

const norm = (s) => (s || '').trim();

export const findBuses = async ({ from, to }) => {
  logInfo('Service:findBuses - Processing request', { from, to });
  const q = { status: BUS_STATUS_APPROVED };
  if (from) q.fromCity = new RegExp(`^${norm(from)}$`, 'i');
  if (to)   q.toCity   = new RegExp(`^${norm(to)}$`, 'i');
  const buses = await Bus.find(q);
  logInfo('Service:findBuses - Success', { count: buses.length });
  return sortByUpcoming(buses);
};

export const createBusEntry = async ({ name, fromCity, toCity, arrivalTime, frequency, createdBy }) => {
  logInfo('Service:createBusEntry - Processing request', { fromCity, toCity });
  const [fromCoords, toCoords] = await Promise.all([geocodeCity(norm(fromCity)), geocodeCity(norm(toCity))]);
  const bus = await Bus.create({
    name: norm(name), fromCity: norm(fromCity), toCity: norm(toCity),
    fromCoords, toCoords,
    arrivalTime: norm(arrivalTime), frequency: norm(frequency) || DEFAULT_FREQUENCY,
    status: BUS_STATUS_APPROVED, createdBy,
  });
  logInfo('Service:createBusEntry - Success', { busId: bus._id });
  return bus;
};

export const updateBusEntry = async (id, update) => {
  logInfo('Service:updateBusEntry - Processing request', { busId: id });
  if (update.fromCity) update.fromCoords = await geocodeCity(norm(update.fromCity));
  if (update.toCity)   update.toCoords   = await geocodeCity(norm(update.toCity));
  const bus = await Bus.findByIdAndUpdate(id, update, { new: true });
  if (!bus) {
    logWarn('Service:updateBusEntry - Bus not found', { busId: id });
    return null;
  }
  logInfo('Service:updateBusEntry - Success', { busId: id });
  return bus;
};

export const deleteBusEntry = async (id) => {
  logInfo('Service:deleteBusEntry - Processing request', { busId: id });
  const bus = await Bus.findByIdAndDelete(id);
  if (!bus) {
    logWarn('Service:deleteBusEntry - Bus not found', { busId: id });
    return null;
  }
  logInfo('Service:deleteBusEntry - Success', { busId: id });
  return bus;
};

export const findNearbyBuses = async ({ from, to }) => {
  logInfo('Service:findNearbyBuses - Processing request', { from, to });
  const [fromCoord, toCoord] = await Promise.all([geocodeCity(from), geocodeCity(to)]);
  if (!fromCoord && !toCoord) {
    logWarn('Service:findNearbyBuses - Both geocodes failed', { from, to });
    return [];
  }

  const allBuses = await Bus.find({ status: BUS_STATUS_APPROVED, fromCoords: { $ne: null }, toCoords: { $ne: null } }).sort({ arrivalTime: 1 });

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
      if (bFrom.includes(sTo) || sTo.includes(bFrom)) return false;
      if (bTo.includes(sFrom) || sFrom.includes(bTo)) return false;
      const fromOk = b.fromDist === null || b.fromDist <= NEARBY_MAX_KM;
      const toOk   = b.toDist   === null || b.toDist   <= NEARBY_MAX_KM;
      return fromOk && toOk;
    });

  logInfo('Service:findNearbyBuses - Success', { count: suggestions.length });
  return sortByUpcoming(suggestions);
};

export const getPopularRoutes = async () => {
  logInfo('Service:getPopularRoutes - Processing request');
  const routes = await Bus.aggregate([
    { $match: { status: BUS_STATUS_APPROVED } },
    { $group: { _id: { from: '$fromCity', to: '$toCity' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: POPULAR_ROUTES_LIMIT },
    { $project: { _id: 0, from: '$_id.from', to: '$_id.to', count: 1 } },
  ]);
  logInfo('Service:getPopularRoutes - Success', { count: routes.length });
  return routes;
};

export const getDistinctCities = async () => {
  logInfo('Service:getDistinctCities - Processing request');
  const [from, to] = await Promise.all([
    Bus.distinct('fromCity', { status: BUS_STATUS_APPROVED }),
    Bus.distinct('toCity',   { status: BUS_STATUS_APPROVED }),
  ]);
  const cities = [...new Set([...from, ...to].map(c => c.trim()).filter(Boolean))].sort();
  logInfo('Service:getDistinctCities - Success', { count: cities.length });
  return cities;
};
