import { Router } from "express";
import { chatController, getConversation, listConversations } from "../controllers/chat.controller.js";
import { authUserMiddleware } from "../middlewares/auth-user.middleware.js";
import { conversationIdValidation, sendMessageValidation } from "../validations/chat.validation.js";
import { validateRequest } from "../validations/validate-request.js";


const chatRouter = Router();

chatRouter.use(authUserMiddleware);

chatRouter.get("/conversations", listConversations);

chatRouter.get(
    "/conversations/:conversationId",
    conversationIdValidation,
    validateRequest,
    getConversation
);

chatRouter.post("/conversation",
    sendMessageValidation,
    validateRequest,
    chatController
)



export { chatRouter };  