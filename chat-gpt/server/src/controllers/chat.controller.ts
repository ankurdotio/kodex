import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { RequestMessage } from "../types/chat.js";
import { getConversationTitle, getStream } from "../service/ai.service.js";
import { conversationDao } from "../dao/conversation.dao.js";
import { messageDao } from "../dao/message.dao.js";
import { ApiError } from "../utils/api-error.js";
import { HumanMessage, AIMessage, ToolMessage, AIMessageChunk } from "langchain";

export const listConversations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    const conversations = await conversationDao.findConversationsByUser(user.userId);

    res.status(200).json({
        conversations: conversations.map((conversation) => ({
            id: conversation._id.toString(),
            title: conversation.title,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt
        }))
    });
});

export const getConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    const conversation = await conversationDao.findConversationByIdAndUser(
        String(req.params.conversationId),
        user.userId
    );
    if (!conversation) {
        throw new ApiError(404, "Conversation not found");
    }

    const messages =  (await messageDao.findMessagesByConversation(conversation._id.toString())).filter((message) => message.author === "user" || (message.author === "ai" && message.toolCalls?.length === 0));

    res.status(200).json({
        conversation: {
            id: conversation._id.toString(),
            title: conversation.title,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messages: messages.map((message) => ({
                id: message._id.toString(),
                author: message.author,
                content: message.content,
                createdAt: message.createdAt
            }))
        }
    });
});

/**
 * POST /api/v1/chat/conversation
 * 
 * req.body = {
 *     message: string,
 *     conversationId?: string
 * }
 */
export const chatController = asyncHandler(async (req: Request<{}, {}, RequestMessage>, res: Response): Promise<void> => {

    let { message, conversationId } = req.body;
    let conversationTitle: string;
    const user = req.user; // Assuming user is attached to the request object after authentication

    if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    if (!conversationId) {
        conversationTitle = await getConversationTitle({ message });
        const newConversation = await conversationDao.createConversation({
            user: user.userId,
            title: conversationTitle,
        })

        conversationId = newConversation._id.toString();
    } else {
        const conversation = await conversationDao.findConversationByIdAndUser(
            conversationId,
            user.userId
        );
        if (!conversation) {
            throw new ApiError(404, "Conversation not found");
        }
        conversationTitle = conversation.title;
    }

    await messageDao.createMessage({
        content: message,
        author: "user",
        conversation: conversationId
    })

    const messages = await messageDao.findMessagesByConversation(conversationId);


    const stream = await getStream({ messages, userId: user.userId });


    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Conversation-Id", conversationId);
    res.setHeader("X-Conversation-Title", encodeURIComponent(conversationTitle));


    for await (const [mode, data] of stream) {
        if (mode === "messages") {

            const [token, metadata] = data;

            if (token.getType() === "ai") {
                res.write(`data: ${JSON.stringify(token.text)}\n\n`);
            }

        } else if (mode === "values") {

            // console.log("Received values:", data);

            const currentStateMessages: (HumanMessage | AIMessage | ToolMessage)[] = data.messages

            const newMessage = currentStateMessages.at(-1);

            console.log("New message:", newMessage);

            if (newMessage instanceof AIMessageChunk) {

                console.log("AIMessageChunk received:", newMessage.tool_calls);

                await messageDao.createMessage({
                    content: newMessage.text || "no content",
                    author: "ai",
                    conversation: conversationId,
                    toolCalls: newMessage.tool_calls ? newMessage.tool_calls.map((call) => {
                        return {
                            arguments: call.args,
                            id: call.id ?? "",
                            name: call.name
                        }
                    }) : []
                })
            } else if (newMessage instanceof ToolMessage) {
                await messageDao.createMessage({
                    content: newMessage.text,
                    author: "tool",
                    conversation: conversationId,
                    toolCallId: newMessage.tool_call_id,
                })
            }
        }
    }


    res.end();

})