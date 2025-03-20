const TaxiDriverGroup = require("../models/TaxiDriverGroup");

// Create a new taxi driver group
exports.createGroup = async (req, res) => {
  try {
    if (!req.user.roles.includes("driver")) {
      return res.status(403).json({ message: "Access denied. Drivers only." });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Group name is required." });
    }

    const existingGroup = await TaxiDriverGroup.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ message: "Group name already exists." });
    }

    const group = await TaxiDriverGroup.create({
      name,
      description,
      drivers: [req.user._id],
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "Group created successfully.", group });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// Join an existing group
exports.joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!req.user.roles.includes("driver")) {
      return res.status(403).json({ message: "Access denied. Drivers only." });
    }

    const group = await TaxiDriverGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (group.drivers.includes(req.user._id)) {
      return res.status(400).json({ message: "You are already a member of this group." });
    }

    group.drivers.push(req.user._id);
    await group.save();

    res.json({ message: "Joined group successfully.", group });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// Remove a driver from the group (Only group creator can remove)
exports.removeDriver = async (req, res) => {
  try {
    const { groupId, driverId } = req.params;

    const group = await TaxiDriverGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (!group.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the group creator can remove drivers." });
    }

    group.drivers = group.drivers.filter((id) => !id.equals(driverId));
    await group.save();

    res.json({ message: "Driver removed from the group.", group });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// Get all groups a driver is part of
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await TaxiDriverGroup.find({ drivers: req.user._id });
    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// Get group details
exports.getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await TaxiDriverGroup.findById(groupId).populate("drivers", "name email");
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }
    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// Delete a group (Only creator can delete)
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await TaxiDriverGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (!group.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the group creator can delete this group." });
    }

    await TaxiDriverGroup.findByIdAndDelete(groupId);
    res.json({ message: "Group deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};
