const Review = require('../src/models/Review');
const Provider = require('../src/models/Provider');

exports.addReview = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const review = await Review.create({ providerId, userId, rating, comment });

    // update provider rating / count
    const reviews = await Review.find({ providerId });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await Provider.findByIdAndUpdate(providerId, { rating: avg, reviewCount: reviews.length });

    res.json(review);
  } catch (err) {
    console.error('addReview', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.listReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    const reviews = await Review.find({ providerId }).populate('userId', 'name').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('listReviews', err);
    res.status(500).json({ error: 'Server error' });
  }
};
