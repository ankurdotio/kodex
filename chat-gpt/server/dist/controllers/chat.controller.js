"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.createSession = exports.getMessages = exports.getSessions = exports.conversation = void 0;
const async_handler_1 = require("../utils/async-handler");
const ai_service_1 = require("../service/ai.service");
const conversation_dao_1 = require("../dao/conversation.dao");
const message_dao_1 = require("../dao/message.dao");
const api_response_1 = require("../utils/api-response");
const api_error_1 = require("../utils/api-error");
/**
 * POST /api/v1/chat/conversation
 * Streams the AI response using Server-Sent Events (SSE).
 */
exports.conversation = (0, async_handler_1.asyncHandler)(async (req, res) => {
    let { message, conversationId } = req.body;
    const user = req.user;
    if (!user) {
        throw new api_error_1.ApiError(401, "Unauthorized");
    }
    if (!message || !message.trim()) {
        throw new api_error_1.ApiError(400, "Message content is required");
    }
    let title = "";
    let isNew = false;
    if (!conversationId) {
        isNew = true;
        title = message.trim().substring(0, 35) || "New Chat";
        const newConversation = await conversation_dao_1.conversationDao.createConversation({
            user: user.userId,
            title,
        });
        conversationId = newConversation._id.toString();
    }
    // Save user message to database
    await message_dao_1.messageDao.createMessage({
        content: message,
        author: "user",
        conversation: conversationId
    });
    const stream = await (0, ai_service_1.getStream)({ message });
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // Send metadata chunk containing conversationId and title first
    res.write(`data: ${JSON.stringify({ conversationId, title, isNew })}\n\n`);
    let aiMessage = "";
    for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        aiMessage += chunk.text;
    }
    res.end();
    // Save assistant message to database
    await message_dao_1.messageDao.createMessage({
        content: aiMessage,
        author: "ai",
        conversation: conversationId
    });
});
/**
 * GET /api/v1/chat/sessions
 * Returns all chat sessions for the authenticated user.
 */
exports.getSessions = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new api_error_1.ApiError(401, "Unauthorized");
    }
    const conversations = await conversation_dao_1.conversationDao.findConversationsByUser(user.userId);
    (0, api_response_1.ApiResponse)(res, 200, "Conversations fetched successfully", {
        sessions: conversations.map((c) => ({
            id: c._id.toString(),
            title: c.title,
            createdAt: c.createdAt
        }))
    });
});
/**
 * GET /api/v1/chat/conversation/:id/messages
 * Returns all messages for a specific conversation.
 */
exports.getMessages = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new api_error_1.ApiError(401, "Unauthorized");
    }
    const { id } = req.params;
    if (!id) {
        throw new api_error_1.ApiError(400, "Conversation ID is required");
    }
    const messages = await message_dao_1.messageDao.findMessagesByConversation(String(id));
    (0, api_response_1.ApiResponse)(res, 200, "Messages fetched successfully", {
        messages: messages.map((m) => ({
            id: m._id.toString(),
            role: m.author,
            content: m.content,
            createdAt: m.createdAt
        }))
    });
});
/**
 * POST /api/v1/chat/session/create
 * Creates a new conversation and generates its title, without saving user messages yet.
 */
exports.createSession = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { message } = req.body;
    const user = req.user;
    if (!user) {
        throw new api_error_1.ApiError(401, "Unauthorized");
    }
    if (!message || !message.trim()) {
        throw new api_error_1.ApiError(400, "Message content is required");
    }
    const title = message.trim().substring(0, 35) || "New Chat";
    const newConversation = await conversation_dao_1.conversationDao.createConversation({
        user: user.userId,
        title,
    });
    (0, api_response_1.ApiResponse)(res, 201, "Session created successfully", {
        conversationId: newConversation._id.toString(),
        title
    });
});
/**
 * DELETE /api/v1/chat/conversation/:id
 * Deletes a conversation and all its messages.
 */
exports.deleteConversation = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new api_error_1.ApiError(401, "Unauthorized");
    }
    const { id } = req.params;
    if (!id) {
        throw new api_error_1.ApiError(400, "Conversation ID is required");
    }
    // Delete associated messages
    await message_dao_1.messageDao.deleteMessagesByConversation(String(id));
    // Delete the conversation session
    await conversation_dao_1.conversationDao.deleteConversation(String(id));
    (0, api_response_1.ApiResponse)(res, 200, "Conversation deleted successfully");
});
