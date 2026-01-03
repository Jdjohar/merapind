const AdminAuditLog = require('../../models/AdminAuditLog');

// LIST logs (paginated)
exports.list = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AdminAuditLog.find()
      .populate('adminId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    AdminAuditLog.countDocuments()
  ]);

  res.json({
    data: logs,
    meta: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
};

// GET single log
exports.getById = async (req, res) => {
  const log = await AdminAuditLog.findById(req.params.id)
    .populate('adminId', 'name email role');

  if (!log) {
    return res.status(404).json({ error: 'Log not found' });
  }

  res.json(log);
};
