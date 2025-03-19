exports.authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user || !req.user.roles.some(role => allowedRoles.includes(role))) {
        return res.status(403).json({ message: 'Access denied' });
      }
      next();
    };
  };
  