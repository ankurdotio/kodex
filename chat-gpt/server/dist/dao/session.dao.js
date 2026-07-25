"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionDao = void 0;
const session_model_1 = require("./models/session.model");
class SessionDao {
    async createSession(input) {
        const { sessionId, ...sessionData } = input;
        return session_model_1.SessionModel.create({
            ...(sessionId ? { _id: sessionId } : {}),
            ...sessionData
        });
    }
    async findActiveById(sessionId) {
        return session_model_1.SessionModel.findOne({
            _id: sessionId,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        });
    }
    async revokeById(sessionId) {
        return session_model_1.SessionModel.findByIdAndUpdate(sessionId, { isRevoked: true }, { returnDocument: 'after' });
    }
    async revokeAllByUser(userId) {
        return session_model_1.SessionModel.updateMany({ userId, isRevoked: false }, { isRevoked: true });
    }
}
exports.sessionDao = new SessionDao();
