const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chatController');
const auth = require('../middleware/auth');

// create/get chat
router.post('/get-or-create', auth, chatController.getOrCreateChat);
router.get('/', auth, chatController.getChatsForUser);

// messages
router.post('/:chatId/messages', auth, chatController.sendMessage);
router.get('/:chatId/messages', auth, chatController.getMessages);

module.exports = router;
