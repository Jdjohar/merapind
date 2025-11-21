// controllers/serviceController.js
const Service = require('../src/models/Service');
const Provider = require('../src/models/Provider');
const { uploadLocalFile } = require('../utils/cloudinary') || {};
const path = require('path');

/**
 * Helper: handle uploaded file(s) or imageUrl field.
 * - If req.file present, upload to Cloudinary (if helper exists) and set imageUrl/images.
 * - If req.files present, upload them in order.
 * - If req.body.imageUrl present (string or JSON array) use that.
 */
async function handleImages(req, body) {
  try {
    if (req.file && req.file.path && typeof uploadLocalFile === 'function') {
      const res = await uploadLocalFile(req.file.path, { folder: 'serviconnect/services' });
      if (res && res.secure_url) {
        body.imageUrl = res.secure_url;
        body.images = body.images || [];
        body.images.unshift(res.secure_url);
      }
    } else if (req.files && Array.isArray(req.files) && typeof uploadLocalFile === 'function') {
      body.images = body.images || [];
      for (const f of req.files) {
        const res = await uploadLocalFile(f.path, { folder: 'serviconnect/services' });
        if (res && res.secure_url) body.images.push(res.secure_url);
      }
      if (body.images.length) body.imageUrl = body.images[0];
    } else if (req.body.imageUrl) {
      // might be a JSON-encoded array or plain string
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
        // plain string
        if (typeof req.body.imageUrl === 'string' && req.body.imageUrl.trim()) {
          body.imageUrl = req.body.imageUrl.trim();
          body.images = [body.imageUrl];
        }
      }
    }
  } catch (err) {
    console.warn('handleImages error', err);
    // don't throw — image upload failure shouldn't break the whole request; controller can decide
  }
}

// ------------------- CREATE SERVICE (provider-only) -------------------
exports.createService = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const provider = await Provider.findOne({ userId: user._id });
    if (!provider) return res.status(403).json({ error: 'Only providers can create services' });

    const {
      title, slug, category, description, price, durationMinutes, images, tags, location, meta
    } = req.body;

    if (!title || !slug) return res.status(400).json({ error: 'Missing fields: title and slug are required' });

    // slug uniqueness for this provider
    const existing = await Service.findOne({ slug, providerId: provider._id });
    if (existing) return res.status(409).json({ error: 'Service with this slug already exists for your account' });

    const body = {
      providerId: provider._id,
      providerName: provider.name,
      providerHourlyRate: provider.hourlyRate,
      title,
      slug,
      category,
      description,
      price: price !== undefined ? Number(price) : 0,
      durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : 60,
      images: images || [],
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? JSON.parse(tags || '[]') : []),
      location: location || provider.location,
      isActive: true,
      meta: meta || {}
    };

    // handle images (multer/cloudinary or provided URL)
    await handleImages(req, body);

    const service = await Service.create(body);
    res.json(service);
  } catch (err) {
    console.error('createService', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ------------------- LIST PROVIDER SERVICES (protected) -------------------
exports.listProviderServices = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const provider = await Provider.findOne({ userId: user._id });
    if (!provider) return res.status(403).json({ error: 'Not a provider' });

    const services = await Service.find({ providerId: provider._id }).sort({ createdAt: -1 });
    res.json({ services });
  } catch (err) {
    console.error('listProviderServices', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ------------------- GET SINGLE SERVICE (public) -------------------
exports.getService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id).lean();
    if (!service) return res.status(404).json({ error: 'Not found' });
    res.json(service);
  } catch (err) {
    console.error('getService', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ------------------- UPDATE SERVICE (provider-only, ownership required) -------------------
exports.updateService = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ error: 'Not found' });

    const provider = await Provider.findOne({ userId: user._id });
    if (!provider || service.providerId.toString() !== provider._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // allowed updates
    const updatable = ['title','slug','category','description','price','durationMinutes','images','tags','isActive','location','meta'];
    updatable.forEach(k => {
      if (req.body[k] !== undefined) {
        service[k] = req.body[k];
      }
    });

    // handle image uploads if present
    await handleImages(req, service);

    await service.save();
    res.json(service);
  } catch (err) {
    console.error('updateService', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ------------------- DELETE SERVICE -------------------
exports.deleteService = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ error: 'Not found' });

    const provider = await Provider.findOne({ userId: user._id });
    if (!provider || service.providerId.toString() !== provider._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await Service.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteService', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ------------------- PUBLIC LIST (search / filters / pagination) -------------------
exports.listPublicServices = async (req, res) => {
  try {
    const { q, category, page = 1, limit = 12, minPrice, maxPrice, providerId } = req.query;
    const filter = { isActive: true };

    if (providerId) filter.providerId = providerId;
    if (category) filter.category = category;
    if (minPrice) filter.price = { ...(filter.price || {}), $gte: parseFloat(minPrice) };
    if (maxPrice) filter.price = { ...(filter.price || {}), $lte: parseFloat(maxPrice) };

    if (q) {
      // use text search if available
      filter.$text = { $search: q };
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const [services, total] = await Promise.all([
      Service.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Service.countDocuments(filter)
    ]);

    res.json({
      services,
      meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) }
    });
  } catch (err) {
    console.error('listPublicServices', err);
    res.status(500).json({ error: 'Server error' });
  }
};
