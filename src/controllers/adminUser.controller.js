import User from '../models/User.js';

export const listUsers = async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
};

export const deleteUser = async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    return res.status(400).json({ message: "You can't delete yourself" });
  }
  const u = await User.findByIdAndDelete(req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  res.json({ ok: true });
};
