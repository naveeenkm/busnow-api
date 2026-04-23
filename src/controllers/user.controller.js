import RideHistory from '../models/RideHistory.js';
import Bus from '../models/Bus.js';
import User from '../models/User.js';
import RouteRequest from '../models/RouteRequest.js';

export const getHistory = async (req, res) => {
  const history = await RideHistory.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('bus');
  res.json({ history });
};

export const addHistory = async (req, res) => {
  const { busId } = req.body;
  const bus = await Bus.findById(busId);
  if (!bus) return res.status(404).json({ message: 'Bus not found' });
  const entry = await RideHistory.create({
    user: req.user._id,
    bus: bus._id,
    fromCity: bus.fromCity,
    toCity: bus.toCity,
  });
  res.status(201).json({ entry });
};

export const getFavorites = async (req, res) => {
  res.json({ favorites: req.user.favorites });
};

export const addFavorite = async (req, res) => {
  const { from, to } = req.body;
  if (!from || !to) return res.status(400).json({ message: 'from and to required' });
  const user = await User.findById(req.user._id);
  user.favorites.push({ from: from.trim(), to: to.trim() });
  await user.save();
  res.status(201).json({ favorites: user.favorites });
};

export const removeFavorite = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.favorites.id(req.params.id)?.deleteOne();
  await user.save();
  res.json({ favorites: user.favorites });
};

export const getMyRequests = async (req, res) => {
  const requests = await RouteRequest.find({ requestedBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ requests });
};

export const updateProfile = async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (name) user.name = name.trim();
  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ message: 'Current password required' });
    const bcrypt = await import('bcryptjs');
    const ok = await bcrypt.default.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be 6+ chars' });
    user.password = await bcrypt.default.hash(newPassword, 10);
  }
  await user.save();
  res.json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
};

export const deleteAccount = async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.json({ ok: true });
};
