const User = require('../../models/User');
const Provider = require('../../models/Provider');
const Service = require('../../models/Service');
const Review = require('../../models/Review');

exports.overview = async (req, res) => {
  const [
    users,
    providers,
    verifiedProviders,
    services,
    reviews
  ] = await Promise.all([
    User.countDocuments(),
    Provider.countDocuments(),
    Provider.countDocuments({ isVerified: true }),
    Service.countDocuments(),
    Review.countDocuments()
  ]);

  res.json({
    users,
    providers,
    verifiedProviders,
    services,
    reviews
  });
};
