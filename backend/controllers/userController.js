const User = require('../models/User');

// Request driver role upgrade
exports.requestDriverUpgrade = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.roles.includes('driver')) {
      return res.status(400).json({ message: 'You already have driver access' });
    }

    // Notify admin (for now, admin manually updates the role in MongoDB)
    res.json({ message: 'Role upgrade request sent. Waiting for admin approval.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
