const ChatModel = require('../models/chatModel');
const MessageModel = require('../models/messageModel');
const AIService = require('../services/aiService');

/**
 * Create a new chat session
 */
const createChat = async (req, res, next) => {
  try {
    const { title, documentIds } = req.body;
    const chat = await ChatModel.create({
      userId: req.user.id,
      title: title || 'New Research Chat',
      documentIds: documentIds || [],
    });

    res.status(201).json({
      success: true,
      message: 'Chat session created.',
      data: { chat },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List all chat sessions for user
 */
const getChats = async (req, res, next) => {
  try {
    const chats = await ChatModel.findByUserId(req.user.id);
    res.status(200).json({
      success: true,
      data: { chats },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get chat by ID with full message history and page citations
 */
const getChatById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const chat = await ChatModel.findById(id, req.user.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: { message: 'Chat session not found.' },
      });
    }

    const messages = await MessageModel.findByChatId(id);

    res.status(200).json({
      success: true,
      data: {
        chat,
        messages,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Send user message and get RAG answer with page citations (Standard JSON)
 */
const sendMessage = async (req, res, next) => {
  try {
    const { id: chatId } = req.params;
    const { query, documentIds } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide a valid question.' },
      });
    }

    const result = await AIService.askQuestion({
      userId: req.user.id,
      chatId,
      query,
      documentIds,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Send user message and stream RAG answer token-by-token using Server-Sent Events (SSE)
 */
const sendMessageStream = async (req, res, next) => {
  try {
    const { id: chatId } = req.params;
    const { query, documentIds } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide a valid question.' },
      });
    }

    await AIService.askQuestionStream({
      userId: req.user.id,
      chatId,
      query,
      documentIds,
      res,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update chat session title (Rename Chat)
 */
const updateChatTitle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const chat = await ChatModel.updateTitle(id, req.user.id, title);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: { message: 'Chat session not found.' },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chat title updated successfully.',
      data: { chat },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete chat session
 */
const deleteChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    await ChatModel.delete(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Chat session deleted.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createChat,
  getChats,
  getChatById,
  sendMessage,
  sendMessageStream,
  updateChatTitle,
  deleteChat,
};
