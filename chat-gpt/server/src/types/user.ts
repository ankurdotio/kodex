type UserModel = {
  id: string;
  name: string;
  email: string;
  password: string;
  verified: boolean;
};

type PasswordResetInput = {
  token: string;
  newPassword: string;
};

export type UserResponse = Omit<UserModel, "password">;

export type RegisterUserRequest = Pick<UserModel, "name" | "email" | "password">;

export type LoginUserRequest = Pick<UserModel, "email" | "password">;

export type ForgotPasswordRequest = Pick<UserModel, "email">;

export type ResetPasswordRequest = Pick<PasswordResetInput, "token" | "newPassword">;

export type UserPatchRequest = Partial<Pick<UserModel, "name" | "email" | "password">>;
