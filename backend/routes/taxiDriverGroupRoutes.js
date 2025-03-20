const express = require("express");
const router = express.Router();
const taxiDriverGroupController = require("../controllers/taxiDriverGroupController");
const { protect } = require("../middlewares/authMiddleware");


router.post("/create", protect, taxiDriverGroupController.createGroup);
router.post("/join/:groupId", protect, taxiDriverGroupController.joinGroup);
router.delete("/remove/:groupId/:driverId", protect, taxiDriverGroupController.removeDriver);
router.get("/my-groups", protect, taxiDriverGroupController.getMyGroups);
router.get("/group/:groupId", protect, taxiDriverGroupController.getGroupDetails);
router.delete("/delete/:groupId", protect, taxiDriverGroupController.deleteGroup);

module.exports = router;
