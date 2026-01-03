const mongoose = require('mongoose');

const AdminSessionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },

    tokenId: {
      type: String,
      required: true,
      unique: true
    },

    expiresAt: {
      type: Date,
      required: true
    },

    revokedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AdminSession', AdminSessionSchema);
