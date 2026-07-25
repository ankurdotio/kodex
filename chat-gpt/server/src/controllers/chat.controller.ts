import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { RequestMessage } from "../types/chat";
import { getConversationTitle, getStream } from "../service/ai.service";
import { conversationDao } from "../dao/conversation.dao";
import { messageDao } from "../dao/message.dao";
import { ApiResponse } from "../utils/api-response";
import { ApiError } from "../utils/api-error";

/**
 * POST /api/v1/chat/conversation
 * Streams the AI response using Server-Sent Events (SSE).
 */
export const conversation = asyncHandler(async (req: Request<{}, {}, RequestMessage>, res: Response): Promise<void> => {
    let { message, conversationId } = req.body;
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    if (!message || !message.trim()) {
        throw new ApiError(400, "Message content is required");
    }

    let title = "";
    let isNew = false;

    if (!conversationId) {
        isNew = true;
        title = message.trim().substring(0, 35) || "New Chat";
        const newConversation = await conversationDao.createConversation({
            user: user.userId,
            title,
        });
        conversationId = newConversation._id.toString();
    }

    // Save user message to database
    await messageDao.createMessage({
        content: message,
        author: "user",
        conversation: conversationId
    });

    const stream = await getStream({ message });

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
    await messageDao.createMessage({
        content: aiMessage,
        author: "ai",
        conversation: conversationId
    });
});

/**
 * GET /api/v1/chat/sessions
 * Returns all chat sessions for the authenticated user.
 */
export const getSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    const conversations = await conversationDao.findConversationsByUser(user.userId);
    ApiResponse(res, 200, "Conversations fetched successfully", {
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
export const getMessages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    const { id } = req.params;
    if (!id) {
        throw new ApiError(400, "Conversation ID is required");
    }

    const messages = await messageDao.findMessagesByConversation(String(id));
    ApiResponse(res, 200, "Messages fetched successfully", {
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
export const createSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { message } = req.body;
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    if (!message || !message.trim()) {
        throw new ApiError(400, "Message content is required");
    }

    const title = message.trim().substring(0, 35) || "New Chat";
    const newConversation = await conversationDao.createConversation({
        user: user.userId,
        title,
    });

    ApiResponse(res, 201, "Session created successfully", {
        conversationId: newConversation._id.toString(),
        title
    });
});

/**
 * DELETE /api/v1/chat/conversation/:id
 * Deletes a conversation and all its messages.
 */
export const deleteConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    const { id } = req.params;
    if (!id) {
        throw new ApiError(400, "Conversation ID is required");
    }

    // Delete associated messages
    await messageDao.deleteMessagesByConversation(String(id));

    // Delete the conversation session
    await conversationDao.deleteConversation(String(id));

    ApiResponse(res, 200, "Conversation deleted successfully");
});