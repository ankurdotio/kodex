import { MessageModel, type MessageDocument } from "./models/message.model.js"
import type { Message } from "../types/chat.js"


class MessageDAO {


    async createMessage(messageData: Message): Promise<MessageDocument> {

        const { content, author, conversation } = messageData;

        const message = await MessageModel.create({ content, author, conversation });

        return message;
    }

    async findMessagesByConversation(conversationId: string): Promise<MessageDocument[]> {
        return MessageModel.find({ conversation: conversationId }).sort({ createdAt: 1 });
    }

    async deleteMessagesByConversation(conversationId: string): Promise<void> {
        await MessageModel.deleteMany({ conversation: conversationId });
    }

}

export const messageDao = new MessageDAO();