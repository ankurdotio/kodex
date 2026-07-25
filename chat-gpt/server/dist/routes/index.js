"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_routes_1 = require("./auth.routes");
const chat_routes_1 = require("./chat.routes");
const router = (0, express_1.Router)();
exports.router = router;
router.get("/health", (_req, res) => {
    res.status(200).json({ message: "Server is healthy" });
});
router.use("/auth", auth_routes_1.authRouter);
router.use("/chat", chat_routes_1.chatRouter);
