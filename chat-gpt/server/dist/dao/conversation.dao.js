"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationDao = void 0;
const conversation_model_js_1 = require("./models/conversation.model.js");
class ConversationDao {
    async createConversation(input) {
        const conversation = await conversation_model_js_1.ConversationModel.create(input);
        return conversation;
    }
    async findConversationsByUser(userId) {
        return conversation_model_js_1.ConversationModel.find({ user: userId }).sort({ createdAt: -1 });
    }
    async deleteConversation(conversationId) {
        await conversation_model_js_1.ConversationModel.deleteOne({ _id: conversationId });
    }
}
exports.conversationDao = new ConversationDao();
