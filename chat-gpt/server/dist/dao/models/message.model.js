"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    conversation: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true
    },
    author: {
        type: String,
        enum: ["user", "ai"],
        default: "user",
    },
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    }
}, {
    timestamps: true
});
exports.MessageModel = (0, mongoose_1.model)("Message", messageSchema);
