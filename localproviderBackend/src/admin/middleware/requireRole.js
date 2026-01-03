module.exports = (...allowed) => {
  return (req, res, next) => {
    if (!allowed.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
