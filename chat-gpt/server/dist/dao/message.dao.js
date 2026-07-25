"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageDao = void 0;
const message_model_js_1 = require("./models/message.model.js");
class MessageDAO {
    async createMessage(messageData) {
        const { content, author, conversation } = messageData;
        const message = await message_model_js_1.MessageModel.create({ content, author, conversation });
        return message;
    }
    async findMessagesByConversation(conversationId) {
        return message_model_js_1.MessageModel.find({ conversation: conversationId }).sort({ createdAt: 1 });
    }
    async deleteMessagesByConversation(conversationId) {
        await message_model_js_1.MessageModel.deleteMany({ conversation: conversationId });
    }
}
exports.messageDao = new MessageDAO();
