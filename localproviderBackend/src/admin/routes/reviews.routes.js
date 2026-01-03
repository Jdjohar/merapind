const Review = require('../../models/Review');
const logAudit = require('../utils/logAudit');

// ---------------------
// LIST ALL REVIEWS
// ---------------------
exports.list = async (req, res) => {
  const reviews = await Review.find()
    .populate('userId', 'name email')
    .populate('providerId', 'name')
    .sort({ createdAt: -1 });

  res.json(reviews);
};

// ---------------------
// GET SINGLE REVIEW
// ---------------------
exports.getById = async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('providerId', 'name');

  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  res.json(review);
};

// ---------------------
// DELETE REVIEW
// ---------------------
exports.remove = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  await review.deleteOne();

  await logAudit(req, 'REVIEW_DELETED', 'REVIEW', review._id);
  res.json({ ok: true });
};

// ---------------------
// FLAG REVIEW
// ---------------------
exports.flag = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  review.isFlagged = true;
  await review.save();

  await logAudit(req, 'REVIEW_FLAGGED', 'REVIEW', review._id);
  res.json({ ok: true });
};

// ---------------------
// RESTORE REVIEW
// ---------------------
exports.restore = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  review.isFlagged = false;
  await review.save();

  await logAudit(req, 'REVIEW_RESTORED', 'REVIEW', review._id);
  res.json({ ok: true });
};
