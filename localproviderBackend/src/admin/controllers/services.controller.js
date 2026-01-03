const Service = require('../../models/Service');
const logAudit = require('../utils/logAudit');

// ---------------------
// LIST SERVICES (ADMIN)
// ---------------------
exports.list = async (req, res) => {
  const services = await Service.find({ isDeleted: false })
    .populate('providerId', 'name')
    .sort({ createdAt: -1 });

  res.json(services);
};

// ---------------------
// ACTIVATE / SUSPEND SERVICE
// ---------------------
exports.toggleStatus = async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  service.isActive = !service.isActive;
  await service.save();

  await logAudit(req, 'SERVICE_STATUS_CHANGED', 'SERVICE', service._id, {
    isActive: service.isActive
  });

  res.json({ ok: true });
};

// ---------------------
// SOFT DELETE SERVICE
// ---------------------
exports.remove = async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  service.isDeleted = true;
  service.isActive = false;
  await service.save();

  await logAudit(req, 'SERVICE_DELETED', 'SERVICE', service._id);

  res.json({ ok: true });
};
