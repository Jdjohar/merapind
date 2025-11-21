const Chat = require('../src/models/Chat');
const Message = require('../src/models/Message');

// start or get chat between user & provider
exports.getOrCreateChat = async (req, res) => {
  try {
    const { providerId } = req.body;
    const userId = req.user._id;

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

exports.getChatsForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ $or: [{ userId }, { providerId: userId }] })
      .populate('userId', 'name')
      .populate('providerId', 'name imageUrl');
    res.json(chats);
  } catch (err) {
    console.error('getChatsForUser', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, audioUrl } = req.body;
    const senderId = req.user._id;

    const message = await Message.create({ chatId, senderId, text, audioUrl });
    await Chat.findByIdAndUpdate(chatId, { lastMessage: text || (audioUrl ? 'Audio' : ''), lastTimestamp: new Date() });

    res.json(message);
  } catch (err) {
    console.error('sendMessage', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const msgs = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) {
    console.error('getMessages', err);
    res.status(500).json({ error: 'Server error' });
  }
};
