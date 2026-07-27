import { MessageModel, type MessageDocument } from "./models/message.model.js"
import type { Message, MongoMessage } from "../types/chat.js"


class MessageDAO {


    async createMessage(messageData: Message): Promise<MessageDocument> {

        const { content, author, conversation } = messageData;

        const message = await MessageModel.create({ content, author, conversation });

        return message;
    }

    async findMessagesByConversation(conversation: string): Promise<MongoMessage[]> {
        return (await MessageModel.find({ conversation }).sort({ createdAt: 1 }).lean()).map((message) => ({
            _id: String(message._id),
            content: message.content,
            author: message.author,
            conversation: message.conversation.toString(),
            createdAt: message.createdAt,
            updatedAt: message.updatedAt
        }));
    }

}

export const messageDao = new MessageDAO();