require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./src/models/Admin');

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = 'admin@domain.com';

  const exists = await Admin.findOne({ email });
  if (exists) {
    console.log('Admin already exists');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash('12345678', 12);

  await Admin.create({
    name: 'Super Admin',
    email,
    password: passwordHash,
    role: 'SUPER_ADMIN'
  });

  console.log('✅ SUPER_ADMIN created');
  process.exit(0);
}

seedAdmin();
