import { MessageModel, type MessageDocument } from "./models/message.model.js"
import type { Message } from "../types/chat.js"


class MessageDAO {


    async createMessage(messageData: Message): Promise<MessageDocument> {

        const { content, author, conversation } = messageData;

        const message = await MessageModel.create({ content, author, conversation });

        return message;
    }

    async findMessagesByConversation(conversation: string) {
        return MessageModel.find({ conversation }).sort({ createdAt: 1 }).lean();
    }

}

export const messageDao = new MessageDAO();