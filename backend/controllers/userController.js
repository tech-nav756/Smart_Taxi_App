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


exports.getUsers = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name role'); // Fetch the user by ID and select name and role fields
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user data
    return res.status(200).json({
      message: 'User details fetched successfully',
      user: { name: user.name, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching user details', error });
  }
};

  

exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // Ensure it's the right user
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        name: user.name, // Ensure the correct fields are returned
        email: user.email,
      }
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error" });
  }
};


