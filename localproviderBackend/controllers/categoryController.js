const Category = require('../src/models/Category');

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, color } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Missing fields' });
    const existing = await Category.findOne({ slug });
    if (existing) return res.status(409).json({ error: 'Slug already exists' });
    const cat = await Category.create({ name, slug, color });
    res.json(cat);
  } catch (err) {
    console.error('createCategory', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.listCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    res.json(cats);
  } catch (err) {
    console.error('listCategories', err);
    res.status(500).json({ error: 'Server error' });
  }
};
