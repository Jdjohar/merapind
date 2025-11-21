const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const providerRoutes = require('./routes/providers');
const reviewRoutes = require('./routes/reviews');
const chatRoutes = require('./routes/chats');
const categoryRoutes = require('./routes/categories');

const app = express();

connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => res.send({ ok: true, message: 'ServiConnect API' }));

app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/categories', categoryRoutes);

// generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
