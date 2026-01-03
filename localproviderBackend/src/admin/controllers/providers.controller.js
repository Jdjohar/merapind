const Provider = require('../../models/Provider');
const Service = require('../../models/Service');
const Review = require('../../models/Review');
const Chat = require('../../models/Chat');
const logAudit = require('../utils/logAudit');

// ---------------------
exports.list = async (req, res) => {
  const providers = await Provider.find().sort({ createdAt: -1 });
  res.json(providers);
};

exports.getById = async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Not found' });
  res.json(provider);
};

exports.verify = async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Not found' });

  provider.isVerified = true;
  await provider.save();

  await logAudit(req, 'PROVIDER_VERIFIED', 'PROVIDER', provider._id);
  res.json({ ok: true });
};

exports.toggleStatus = async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  provider.isActive = !provider.isActive;
  await provider.save();

  await logAudit(req, 'PROVIDER_STATUS_CHANGED', 'PROVIDER', provider._id, {
    isActive: provider.isActive
  });

  res.json({ ok: true });
};

exports.toggleVerification = async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  provider.isVerified = !provider.isVerified;
  await provider.save();

  await logAudit(req, 'PROVIDER_VERIFICATION_CHANGED', 'PROVIDER', provider._id, {
    isVerified: provider.isVerified
  });

  res.json({ ok: true });
};

exports.remove = async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  provider.isDeleted = true;
  provider.isActive = false;
  await provider.save();

  await logAudit(req, 'PROVIDER_DELETED', 'PROVIDER', provider._id);
  res.json({ ok: true });
};


exports.update = async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Not found' });

  Object.assign(provider, req.body);
  await provider.save();

  await logAudit(req, 'PROVIDER_UPDATED', 'PROVIDER', provider._id);
  res.json(provider);
};

exports.remove = async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Not found' });

  await provider.deleteOne();
  await logAudit(req, 'PROVIDER_DELETED', 'PROVIDER', provider._id);

  res.json({ ok: true });
};

// ---------------------
// RELATED DATA
// ---------------------
exports.getServices = async (req, res) => {
  const services = await Service.find({ providerId: req.params.id });
  res.json(services);
};

exports.getReviews = async (req, res) => {
  const reviews = await Review.find({ providerId: req.params.id });
  res.json(reviews);
};

exports.getChats = async (req, res) => {
  const chats = await Chat.find({ providerId: req.params.id });
  res.json(chats);
};
