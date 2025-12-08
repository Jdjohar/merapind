// routes/chats.js

const express = require("express");
const router = express.Router();

// FIXED PATHS — your controllers folder is OUTSIDE src/
const chatController = require("../../controllers/chatController");

// FIXED PATH — your middleware is in middleware/auth.js
const auth = require("../middleware/auth");

// -------------------------------
// Chat Routes
// -------------------------------

// Create or get chat between user & provider
router.post("/get-or-create", auth, chatController.getOrCreateChat);

// Get all chats for a user (user or provider)
router.get("/", auth, chatController.getChatsForUser);

// Send a message
router.post("/:chatId/messages", auth, chatController.sendMessage);

// Get messages for a chat
router.get("/:chatId/messages", auth, chatController.getMessages);

module.exports = router;
