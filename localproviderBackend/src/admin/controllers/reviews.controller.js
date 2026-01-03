const Review = require('../../models/Review');
const logAudit = require('../utils/logAudit');

exports.remove = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  await review.deleteOne();
  await logAudit(req, 'REVIEW_REMOVED', 'REVIEW', review._id);

  res.json({ ok: true });
};
