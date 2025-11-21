// index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const providerRoutes = require('./src/routes/providers');
const reviewRoutes = require('./src/routes/reviews');
const chatRoutes = require('./src/routes/chats');
const categoryRoutes = require('./src/routes/categories');
const servicesRoutes = require('./src/routes/providerServices');

const app = express();

// connect DB BEFORE starting server / routes (optional: you can also await connect in start function)
connectDB();

// middleware
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// CORS - configure once, BEFORE routes
const allowedOrigins = [
  "http://localhost:3000",
  "https://maurya-electronics-mk.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like native/mobile clients or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS: Origin not allowed'), false);
    }
  },
  credentials: true, // Access-Control-Allow-Credentials: true
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization, Origin, X-Requested-With, Accept"
};

// Ensure preflight requests get the right headers
app.options('*', cors(corsOptions));
// Use configured CORS for all routes
app.use(cors(corsOptions));

// routes
app.get('/', (req, res) => res.send({ ok: true, message: 'ServiConnect API' }));
// app.use('/api/provider/services', require('./src/routes/providerServices'));

app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/services', servicesRoutes);

// generic error handler (CORS errors thrown by origin function will come here)
app.use((err, req, res, next) => {
  console.error(err);
  // If CORS origin rejection, respond 403 with message
  if (err && err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const path = require('path');

// const app = express();

// // --- Safe imports (won’t crash function) ---
// let mongoDB, job;
// try {
//   mongoDB = require('./db');
// } catch (err) {
//   console.error("⚠️ db.js not found or failed to load:", err.message);
// }

// try {
//   job = require('./cron')?.job;
// } catch (err) {
//   console.error("⚠️ cron.js not found or failed to load:", err.message);
// }

// let apiRoutes;
// try {
//   apiRoutes = require('./Routes/api');
// } catch (err) {
//   console.error("⚠️ Routes/api.js not found or failed to load:", err.message);
// }

// // --- Middleware setup ---
// app.use(bodyParser.json({ limit: '10mb' }));
// app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "https://maurya-electronics-mk.vercel.app",
//     ],
//     methods: "GET,POST,OPTIONS,PUT,DELETE",
//     allowedHeaders: "Content-Type,Authorization,Origin,X-Requested-With,Accept",
//   })
// );

// // --- Connect MongoDB safely ---
// if (mongoDB) {
//   mongoDB()
//     .then(() => console.log("✅ MongoDB connected"))
//     .catch(err => console.error("❌ MongoDB connection error:", err.message));
// }

// // --- Start cron safely (optional) ---
// if (job && typeof job.start === 'function') {
//   try {
//     job.start();
//     console.log("✅ Cron job started");
//   } catch (err) {
//     console.error("⚠️ Cron job error:", err.message);
//   }
// }

// // --- Static files ---
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// // --- Routes ---
// app.get('/', (req, res) => {
//   res.send('✅ Express API is running on Vercel!');
// });

// if (apiRoutes) {
//   app.use('/api', apiRoutes);
// } else {
//   app.get('/api', (req, res) => res.status(500).send('⚠️ API routes failed to load.'));
// }

// // --- Export app (no app.listen) ---
// module.exports = app;
