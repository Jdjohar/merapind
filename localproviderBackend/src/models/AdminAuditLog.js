const mongoose = require('mongoose');

const AdminAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },

    action: {
      type: String,
      required: true
      // e.g. ADMIN_LOGIN, USER_UPDATED, CATEGORY_CREATED
    },

    entityType: {
      type: String
      // USER, PROVIDER, CATEGORY, SYSTEM
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId
    },

    meta: {
      type: Object
    },

    ipAddress: String,
    userAgent: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminAuditLog', AdminAuditLogSchema);
