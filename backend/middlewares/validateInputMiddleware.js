const { body, validationResult } = require('express-validator');

// Input sanitization
const validateSignup = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).trim().escape(),
  body('role').isIn(['passenger', 'driver']),
  body('name').trim().escape(),
  body('phoneNumber').isMobilePhone().trim().escape(),
];

const validateErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = { validateSignup, validateErrors };
