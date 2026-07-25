import { ConversationModel, type ConversationDocument } from "./models/conversation.model.js"


class ConversationDao {

    async createConversation(input: { title: string; user: string }): Promise< ConversationDocument > {

        const conversation = await ConversationModel.create(input);
        return conversation;
        
    }

    async findConversationsByUser(userId: string): Promise<ConversationDocument[]> {
        return ConversationModel.find({ user: userId }).sort({ createdAt: -1 });
    }

    async deleteConversation(conversationId: string): Promise<void> {
        await ConversationModel.deleteOne({ _id: conversationId });
    }
    
}

export const conversationDao = new ConversationDao();