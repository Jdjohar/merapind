const Category = require('../../models/Category');
const logAudit = require('../utils/logAudit');
const Provider = require('../../models/Provider');
// ---------------------
// LIST ALL CATEGORIES
// ---------------------
exports.list = async (req, res) => {
  const categories = await Category.find()
    .sort({ order: 1, name: 1 });

  res.json(categories);
};

// ---------------------
// CREATE CATEGORY
// ---------------------
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

exports.create = async (req, res) => {
  let { name, color, order } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const slug = slugify(name);

  const exists = await Category.findOne({ slug });
  if (exists) {
    return res.status(409).json({ error: 'Category already exists' });
  }

  const category = await Category.create({
    name,
    slug,
    color,
    order: Number(order) || 0
  });

  res.status(201).json(category);
};

// ---------------------
// UPDATE CATEGORY
// ---------------------
exports.update = async (req, res) => {
  const { name, slug, color } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // Prevent slug duplication
  if (slug && slug !== category.slug) {
    const exists = await Category.findOne({ slug });
    if (exists) {
      return res.status(409).json({ error: 'Slug already in use' });
    }
  }

  if (name !== undefined) category.name = name;
  if (slug !== undefined) category.slug = slug;
  if (color !== undefined) category.color = color;

  await category.save();

  await logAudit(req, 'CATEGORY_UPDATED', 'CATEGORY', category._id);

  res.json(category);
};
exports.updateOrder = async (req, res) => {
  const { order } = req.body;

  await Category.findByIdAndUpdate(req.params.id, {
    order: Number(order)
  });

  res.json({ ok: true });
};
// ---------------------
// DELETE CATEGORY (HARD DELETE)
// ---------------------
exports.remove = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  await Category.deleteOne({ _id: category._id });

  await logAudit(req, 'CATEGORY_DELETED', 'CATEGORY', category._id);

  res.json({ ok: true });
};
exports.listWithCounts = async (req, res) => {
  const categories = await Category.aggregate([
    {
      $lookup: {
        from: 'providers',
        localField: 'slug',
        foreignField: 'category',
        as: 'providers'
      }
    },
    {
      $addFields: {
        providerCount: { $size: '$providers' }
      }
    },
    {
      $project: {
        providers: 0
      }
    },
    {
      $sort: { order: 1, name: 1 }
    }
  ]);

  res.json(categories);
};