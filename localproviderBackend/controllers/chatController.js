// src/controllers/chatController.js
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Chat = require('../src/models/Chat');
const Message = require('../src/models/Message');
const Provider = require('../src/models/Provider');
const User = require('../src/models/User');

// Helper to ensure ObjectId validity
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

/**
 * Role-aware get-or-create chat.
 * - If caller is USER -> body must provide providerId
 * - If caller is PROVIDER -> body must provide userId (provider resolved from req.user)
 */
exports.getOrCreateChat = async (req, res) => {
  try {
    const callerUserId = req.user._id;
    const callerRole = req.user.role; // "USER" or "PROVIDER"

    let { providerId, userId } = req.body || {};

    if (callerRole === 'PROVIDER') {
      // find provider record for this user
      const provider = await Provider.findOne({ userId: callerUserId }).lean();
      if (!provider) return res.status(404).json({ error: 'Provider profile not found for this account' });

      providerId = providerId || provider._id.toString();
      if (!userId) return res.status(400).json({ error: 'Missing userId for provider-initiated chat' });
    } else {
      // caller is USER
      userId = callerUserId.toString();
      if (!providerId) return res.status(400).json({ error: 'Missing providerId' });
    }

    if (!isValidId(providerId) || !isValidId(userId)) {
      return res.status(400).json({ error: 'Invalid ids provided' });
    }

    // find chat where both userId and providerId match
    let chat = await Chat.findOne({ userId, providerId });
    if (!chat) {
      chat = await Chat.create({ userId, providerId });
    }

    res.json(chat);
  } catch (err) {
    console.error('getOrCreateChat', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Send message via HTTP endpoint
 * Validates sender is participant of the chat.
 * Request body: { text?, audioUrl? }
 */
// exports.sendMessage = async (req, res) => {
//   try {
//     const { chatId } = req.params;
//     const { text, audioUrl } = req.body || {};
//     const senderUserId = req.user._id;

//     if (!isValidId(chatId)) return res.status(400).json({ error: 'Invalid chatId' });

//     const chat = await Chat.findById(chatId);
//     if (!chat) return res.status(404).json({ error: 'Chat not found' });

//     // verify sender is either the user or the provider's userId
//     const providerDoc = await Provider.findById(chat.providerId).lean();
//     const providerUserId = providerDoc ? String(providerDoc.userId) : null;
//     const isParticipant = String(chat.userId) === String(senderUserId) || providerUserId === String(senderUserId);
//     if (!isParticipant) return res.status(403).json({ error: 'Not a participant of this chat' });

//     const message = await Message.create({
//       chatId,
//       senderId: senderUserId,
//       text,
//       audioUrl,
//       isMe: true,
//       timestamp: new Date()
//     });

//     // update chat summary
//     await Chat.findByIdAndUpdate(chatId, {
//       lastMessage: text || (audioUrl ? 'Audio' : ''),
//       lastTimestamp: new Date()
//     }).catch(() => { /* ignore */ });

//     // broadcast via socket if available (app.set('io', io) in index.js)
//     try {
//       const io = req.app && req.app.get && req.app.get('io');
//       if (io) {
//         io.to(chatId.toString()).emit('receive_message', message);
//       }
//     } catch (e) {
//       console.warn('socket broadcast failed', e);
//     }

//     res.json(message);
//   } catch (err) {
//     console.error('sendMessage (http) error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, audioUrl, tempId } = req.body;
    const senderId = req.user._id;

    // minimal validation
    if (!chatId) return res.status(400).json({ error: 'Missing chatId' });

    // Optionally prevent duplicate saves by tempId (safe-guard)
    if (tempId) {
      const existing = await Message.findOne({ chatId, tempId });
      if (existing) {
        // return existing to client (idempotent)
        return res.json(existing);
      }
    }

    // create
    const message = await Message.create({
      chatId,
      senderId,
      text: text || undefined,
      audioUrl: audioUrl || undefined,
      isMe: undefined, // server doesn't set this
      timestamp: new Date(),
      tempId: tempId || undefined // store tempId so we can dedupe later
    });

    // update chat lastMessage info
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: text || (audioUrl ? 'Audio' : ''),
      lastTimestamp: new Date()
    });

    // Broadcast once to socket room
    const io = req.app.get('io');
    const payload = {
      _id: message._id,
      chatId: message.chatId,
      senderId: message.senderId,
      text: message.text,
      audioUrl: message.audioUrl,
      createdAt: message.createdAt || message.timestamp,
      tempId: tempId || undefined
    };

    if (io) {
      io.to(chatId.toString()).emit('receive_message', payload);
      // optional: emit a short 'chat_updated' to refresh chat summary lists
      io.to(chatId.toString()).emit('chat_updated', { chatId, lastMessage: payload.text || (payload.audioUrl ? 'Audio' : ''), lastTimestamp: payload.createdAt });
    }

    // return the saved message (including tempId if provided)
    return res.json(payload);
  } catch (err) {
    console.error('sendMessage', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * List chats for logged-in account (works for USER and PROVIDER)
 */
exports.getChatsForUser = async (req, res) => {
  try {
    const callerUserId = req.user._id;
    const callerRole = req.user.role;

    let filter;
    if (callerRole === 'PROVIDER') {
      const provider = await Provider.findOne({ userId: callerUserId }).lean();
      if (!provider) return res.status(404).json({ error: 'Provider profile not found' });
      filter = { $or: [{ userId: callerUserId }, { providerId: provider._id }] };
    } else {
      filter = { $or: [{ userId: callerUserId }] };
    }

    const chats = await Chat.find(filter)
      .populate('userId', 'name')
      .populate('providerId', 'name imageUrl');

    res.json(chats);
  } catch (err) {
    console.error('getChatsForUser', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get messages in a chat (ensure requester is a participant)
 */
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const callerUserId = req.user._id;

    if (!isValidId(chatId)) return res.status(400).json({ error: 'Invalid chatId' });
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Not found' });

    const providerDoc = await Provider.findById(chat.providerId).lean();
    const providerUserId = providerDoc ? String(providerDoc.userId) : null;
    const isParticipant = String(chat.userId) === String(callerUserId) || providerUserId === String(callerUserId);
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant of this chat' });

    const msgs = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) {
    console.error('getMessages', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = exports;
