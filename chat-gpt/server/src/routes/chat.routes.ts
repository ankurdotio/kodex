import { Router } from "express";
import { conversation, getSessions, getMessages, createSession, deleteConversation } from "../controllers/chat.controller";
import { authUserMiddleware } from "../middlewares/auth-user.middleware";
import { sendMessageValidation } from "../validations/chat.validation";
import { validateRequest } from "../validations/validate-request";

const chatRouter = Router();

chatRouter.use(authUserMiddleware);

chatRouter.post("/conversation",
    sendMessageValidation,
    validateRequest,
    conversation
);

chatRouter.post("/session/create", createSession);

chatRouter.get("/sessions", getSessions);
chatRouter.get("/conversation/:id/messages", getMessages);
chatRouter.delete("/conversation/:id", deleteConversation);

export { chatRouter };