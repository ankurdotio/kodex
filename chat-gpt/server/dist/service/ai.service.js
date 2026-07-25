"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversationTitle = getConversationTitle;
exports.getStream = getStream;
const mistralai_1 = require("@langchain/mistralai");
const langchain_1 = require("langchain");
const env_js_1 = __importDefault(require("../config/env.js"));
const z = __importStar(require("zod"));
const smallModel = new mistralai_1.ChatMistralAI({
    model: "mistral-small-latest",
    apiKey: env_js_1.default.MISTRAL_API_KEY
});
const mediumModel = new mistralai_1.ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: env_js_1.default.MISTRAL_API_KEY
});
async function getConversationTitle({ message }) {
    const agent = (0, langchain_1.createAgent)({
        model: smallModel,
        responseFormat: z.object({
            title: z.string().max(30).describe("The title of the conversation, max 30 characters")
        }),
        systemPrompt: `You are an assistant that generates a concise title for a conversation based on the user's first message.`
    });
    const response = await agent.invoke({
        messages: [
            new langchain_1.HumanMessage(message)
        ]
    });
    return response.structuredResponse.title;
}
async function getStream({ message }) {
    const stream = await mediumModel.stream(message);
    return stream;
}
