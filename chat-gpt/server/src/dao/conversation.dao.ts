import { ConversationModel, type ConversationDocument } from "./models/conversation.model.js"


class ConversationDao {

    async createConversation(input: { title: string; user: string }): Promise< ConversationDocument > {

        const conversation = await ConversationModel.create(input);
        return conversation;
        
    }

    async findConversationsByUser(user: string) {
        return ConversationModel.find({ user }).sort({ updatedAt: -1 }).lean();
    }

    async findConversationByIdAndUser(conversationId: string, user: string) {
        return ConversationModel.findOne({ _id: conversationId, user }).lean();
    }
    
}

export const conversationDao = new ConversationDao();