const express = require("express");
const passport = require("passport");
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');


const router = express.Router();

// Google Login Route
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Callback Route
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    res.json({
      message: "Login successful",
      user: req.user.user,
      token: req.user.token,
    });
  }
);

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/profile', protect, authController.getUserProfile);

module.exports = router;
