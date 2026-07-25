import { UserModel } from "./models/user.model";

class UserDao {
  async createUser(input: { name: string; email: string; passwordHash: string; verified?: boolean }) {
    const user = await UserModel.create(input);
    return user;
  }

  async findByEmail(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() });
  }

  async findById(userId: string) {
    return UserModel.findById(userId);
  }

  async setResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: expiresAt
      },
      { returnDocument: 'after' }
    );
  }

  async findByValidResetToken(tokenHash: string) {
    return UserModel.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() }
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        passwordHash,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null
      },
      { returnDocument: 'after' }
    );
  }

  async setVerificationOtp(userId: string, otpHash: string, expiresAt: Date) {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        verificationOtpHash: otpHash,
        verificationOtpExpiresAt: expiresAt
      },
      { returnDocument: 'after' }
    );
  }

  async markEmailAsVerified(userId: string) {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        verified: true,
        verificationOtpHash: null,
        verificationOtpExpiresAt: null
      },
      { returnDocument: 'after' }
    );
  }
}

export const userDao = new UserDao();
