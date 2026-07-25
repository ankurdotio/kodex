const envConstants = {
    PORT: 5000,
    MONGODB_URI: "mongodb://127.0.0.1:27017/chatgpt_clone",
    ACCESS_TOKEN_TTL: "15m",
    REFRESH_TOKEN_TTL: "7d",
    REFRESH_COOKIE_NAME: "refreshToken",
    NODE_ENV: "development",
    LOGGER_LEVEL: "info",
    SMTP_HOST: "localhost",
    SMTP_PORT: 1025,
    SMTP_USER: "",
    SMTP_PASS: "",
    MAIL_FROM: "noreply@chatgpt-clone.local",
    SEND_MAIL: false,
    EMAIL_VERIFICATION: false,
}

export default envConstants;