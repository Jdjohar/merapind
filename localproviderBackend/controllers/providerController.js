// controllers/providerController.js
const Provider = require('../src/models/Provider');
const Review = require('../src/models/Review');
const User = require('../src/models/User');
const { uploadLocalFile } = require('../utils/cloudinary');
const path = require('path');

/**
 * Helper: decide how to attach image(s) to provider body
 * - If multer uploaded a file -> upload to Cloudinary and set imageUrl / images
 * - If req.body.imageUrl present (string or array) -> use it
 */
async function handleImageUpload(req, body) {
  // multer file (single)
  if (req.file && req.file.path) {
    // upload to Cloudinary
    const localPath = req.file.path;
    const uploadRes = await uploadLocalFile(localPath, { folder: 'serviconnect/providers' });
    // cloudinary returns secure_url
    if (uploadRes && uploadRes.secure_url) {
      body.imageUrl = uploadRes.secure_url;
      body.images = body.images || [];
      body.images.unshift(uploadRes.secure_url);
    }
  } else if (req.files && Array.isArray(req.files) && req.files.length) {
    // multiple files
    body.images = body.images || [];
    for (const f of req.files) {
      const res = await uploadLocalFile(f.path, { folder: 'serviconnect/providers' });
      if (res && res.secure_url) body.images.push(res.secure_url);
    }
    if (body.images.length) body.imageUrl = body.images[0];
  } else if (req.body.imageUrl) {
    // client provided an image URL string or JSON encoded array
    try {
      const parsed = JSON.parse(req.body.imageUrl);
      if (Array.isArray(parsed)) {
        body.images = parsed;
        body.imageUrl = parsed[0];
      } else if (typeof parsed === 'string') {
        body.imageUrl = parsed;
        body.images = [parsed];
      }
    } catch (err) {
      // not JSON - assume plain string
      if (typeof req.body.imageUrl === 'string' && req.body.imageUrl.trim()) {
        body.imageUrl = req.body.imageUrl.trim();
        body.images = [body.imageUrl];
      }
    }
  }
}

// Create provider profile (supports file upload)
exports.createProvider = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    // ensure role is PROVIDER (optional)
    if (req.user.role !== 'PROVIDER') {
      return res.status(403).json({ error: 'Only users with role PROVIDER can create a provider profile' });
    }

    // prevent duplicate
    const existing = await Provider.findOne({ userId });
    if (existing) return res.status(409).json({ error: 'Provider profile already exists' });

    const body = { ...req.body };

    // Make numeric conversions
    if (body.hourlyRate !== undefined) body.hourlyRate = Number(body.hourlyRate);
    if (body.lat !== undefined) body.lat = Number(body.lat);
    if (body.lng !== undefined) body.lng = Number(body.lng);

    // Handle images: req.file (multer) or req.body.imageUrl
    await handleImageUpload(req, body);

    // set userId server-side
    body.userId = userId;

    // create provider
    const provider = await Provider.create(body);

    res.json(provider);
  } catch (err) {
    console.error('createProvider', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// get provider for logged-in user
exports.getMyProvider = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const provider = await Provider.findOne({ userId }).lean();
    if (!provider) return res.status(404).json({ error: 'Provider profile not found' });

    const reviews = await Review.find({ providerId: provider._id }).lean();
    provider.reviews = reviews;
    res.json(provider);
  } catch (err) {
    console.error('getMyProvider', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// update provider (supports file upload)
exports.updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await Provider.findById(id);
    if (!provider) return res.status(404).json({ error: 'Not found' });

    if (provider.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const body = { ...req.body };

    if (body.hourlyRate !== undefined) body.hourlyRate = Number(body.hourlyRate);
    if (body.lat !== undefined) body.lat = Number(body.lat);
    if (body.lng !== undefined) body.lng = Number(body.lng);

    // handle uploaded file if present
    await handleImageUpload(req, body);

    Object.assign(provider, body);
    await provider.save();

    res.json(provider);
  } catch (err) {
    console.error('updateProvider', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// delete provider
exports.deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await Provider.findById(id);
    if (!provider) return res.status(404).json({ error: 'Not found' });
    if (provider.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await Provider.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteProvider', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// list providers (public)
exports.listProviders = async (req, res) => {
  try {
    const { lat, lng, radiusKm, category, q } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [{ name: regex }, { description: regex }, { location: regex }, { category: regex }];
    }

    let results = await Provider.find(filter).lean();

    // optional distance calc (same as before)
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const rad = parseFloat(radiusKm || '9999');
      results = results.map((p) => {
        if (typeof p.lat === 'number' && typeof p.lng === 'number') {
          const toRad = (deg) => (deg * Math.PI) / 180;
          const R = 6371;
          const dLat = toRad(p.lat - userLat);
          const dLon = toRad(p.lng - userLng);
          const lat1 = toRad(userLat);
          const lat2 = toRad(p.lat);
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceKm = R * c;
          p.distanceKm = Math.round(distanceKm * 10) / 10;
        } else {
          p.distanceKm = undefined;
        }
        return p;
      });

      if (!isNaN(rad)) {
        results = results.filter((p) => typeof p.distanceKm === 'number' && p.distanceKm <= rad);
      }

      results.sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
    }

    res.json(results);
  } catch (err) {
    console.error('listProviders', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// get provider by id
exports.getProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await Provider.findById(id).lean();
    if (!provider) return res.status(404).json({ error: 'Not found' });
    const reviews = await Review.find({ providerId: provider._id }).lean();
    provider.reviews = reviews;
    res.json(provider);
  } catch (err) {
    console.error('getProvider', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = exports;
