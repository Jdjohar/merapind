const express = require('express');
const router = express.Router();
const reviewController = require('../../controllers/reviewController');
const auth = require('../middleware/auth');

// add & list reviews for provider
router.post('/:providerId', auth, reviewController.addReview);
router.get('/:providerId', reviewController.listReviews);

module.exports = router;
