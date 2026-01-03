const AdminAuditLog = require('../../models/AdminAuditLog');

module.exports = async function logAudit(
  req,
  action,
  entityType = 'SYSTEM',
  entityId = null,
  meta = {}
) {
  if (!req.admin) return;

  try {
    await AdminAuditLog.create({
      adminId: req.admin.id,
      action,
      entityType,
      entityId,
      meta,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};
