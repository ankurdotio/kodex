"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageValidation = void 0;
const express_validator_1 = require("express-validator");
exports.sendMessageValidation = [
    (0, express_validator_1.body)("message").isString().notEmpty().withMessage("Message is required"),
    (0, express_validator_1.body)("conversationId")
        .optional()
        .isString()
        .withMessage("Conversation ID must be a string")
        .isMongoId()
        .withMessage("Conversation ID must be a valid MongoDB ObjectId")
];
