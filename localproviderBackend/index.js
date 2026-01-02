// index.js
const express = require('express');
const http = require('http');               // REQUIRED for socket.io
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();
require('./cron');  
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const providerRoutes = require('./src/routes/providers');
const reviewRoutes = require('./src/routes/reviews');
const chatRoutes = require('./src/routes/chats');
const categoryRoutes = require('./src/routes/categories');
const servicesRoutes = require('./src/routes/providerServices');
const uploadRoutes = require('./src/routes/uploads');

const jwt = require('jsonwebtoken');
const Chat = require('./src/models/Chat');
const Provider = require('./src/models/Provider');
const Message = require('./src/models/Message');

const app = express();

// Create HTTP server (CRITICAL for socket.io)
const server = http.createServer(app);

// -------------------------
// SOCKET.IO SETUP (with JWT auth)
// -------------------------
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://merapind-eight.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// Socket auth middleware and handlers (replace existing socket setup)
io.use((socket, next) => {
  try {
    // token can be provided via handshake.auth.token or Authorization header
    const token =
      socket.handshake?.auth?.token ||
      (socket.handshake?.headers?.authorization || '').split(' ')[1] ||
      null;

    if (!token) {
      return next(new Error('Authentication error: token missing'));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload should contain { id, role? }
    socket.user = { id: String(payload.id), role: payload.role || 'USER' };

    console.log('[socket auth] payload:', payload);
    return next();
  } catch (err) {
    console.warn('[socket auth] failed', err && err.message);
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('🔥 Socket connected:', socket.id, 'user=', socket.user && socket.user.id, 'role=', socket.user && socket.user.role);

  socket.on('join_chat', async (chatId) => {
    try {
      if (!chatId) return;
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      // resolve provider.userId
      const providerDoc = await Provider.findById(chat.providerId).lean();
      const providerUserId = providerDoc ? String(providerDoc.userId) : null;
      const callerUserId = String(socket.user.id);

      if (String(chat.userId) !== callerUserId && providerUserId !== callerUserId) {
        socket.emit('error', { message: 'Not authorized to join this chat' });
        return;
      }

      socket.join(chatId.toString());
      socket.emit('joined_chat', { chatId });
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    } catch (err) {
      console.error('join_chat error', err);
      socket.emit('error', { message: 'Server error during join' });
    }
  });

  socket.on('send_message', async (payload) => {
    try {
      const { chatId, text, audioUrl } = payload || {};
      const senderUserId = String(socket.user.id);

      if (!chatId) {
        socket.emit('error', { message: 'chatId required' });
        return;
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      const providerDoc = await Provider.findById(chat.providerId).lean();
      const providerUserId = providerDoc ? String(providerDoc.userId) : null;

      const isParticipant = String(chat.userId) === senderUserId || providerUserId === senderUserId;
      if (!isParticipant) {
        socket.emit('error', { message: 'Not a participant of this chat' });
        return;
      }

      // persist
      const message = await Message.create({
        chatId,
        senderId: senderUserId,
        text,
        audioUrl,
        isMe: true,
        timestamp: new Date()
      });

      // update chat summary
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: text || (audioUrl ? 'Audio' : ''),
        lastTimestamp: new Date()
      }).catch(() => {});

      io.to(chatId.toString()).emit('receive_message', message);
    } catch (err) {
      console.error('socket send_message error', err);
      socket.emit('error', { message: 'Server error' });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', socket.id, reason);
  });
});


// Make socket available everywhere
app.set("io", io);

// Connect DB
connectDB();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

const allowedOrigins = [
  "http://localhost:3000",
  "https://merapind-eight.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS: Origin not allowed"), false);
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization, Origin, X-Requested-With, Accept",
};

// Preflight fix
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

// Routes
app.get('/', (req, res) => res.send({ ok: true, message: 'ServiConnect API' }));

app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/uploads', uploadRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Start server using `server.listen` (NOT app.listen)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

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
