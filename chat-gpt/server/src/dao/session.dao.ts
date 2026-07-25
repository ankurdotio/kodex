import { SessionModel } from "./models/session.model";

class SessionDao {
  async createSession(input: {
    sessionId?: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent: string;
    ipAddress: string;
  }) {
    const { sessionId, ...sessionData } = input;

    return SessionModel.create({
      ...(sessionId ? { _id: sessionId } : {}),
      ...sessionData
    });
  }

  async findActiveById(sessionId: string) {
    return SessionModel.findOne({
      _id: sessionId,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    });
  }

  async revokeById(sessionId: string) {
    return SessionModel.findByIdAndUpdate(
      sessionId,
      { isRevoked: true },
      { returnDocument: 'after' }
    );
  }

  async revokeAllByUser(userId: string) {
    return SessionModel.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }
}

export const sessionDao = new SessionDao();
