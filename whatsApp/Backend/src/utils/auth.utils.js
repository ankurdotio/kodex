import jwt from 'jsonwebtoken';
import config from '../config/config.js';


/**
 * Generates a JWT access token for the given userId.
 * @param {string} userId - The ID of the user for whom to generate the access token.
 * @returns {string} - The generated JWT access token.
 */
export const generateAccessToken = (userId) => {
    const accessToken = jwt.sign({ userId }, config.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    return accessToken;
}

/**
 * Generates a JWT refresh token for the given userId.
 * @param {string} userId - The ID of the user for whom to generate the refresh token.
 * @returns {string} - The generated JWT refresh token.
 */
export const generateRefreshToken = (userId) => {
    const refreshToken = jwt.sign({ userId }, config.JWT_REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return refreshToken;
}


/**
 * Verifies the provided JWT access token.
 * @param {string} token - The JWT access token to verify.
 * @returns {Object} - The decoded payload of the verified token.
 * @throws {Error} - Throws an error if the token is invalid or expired.
 */
export const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_TOKEN_SECRET);
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
}

/**
 * Verifies the provided JWT refresh token.
 * @param {string} token - The JWT refresh token to verify.
 * @returns {Object} - The decoded payload of the verified token.
 * @throws {Error} - Throws an error if the token is invalid or expired.
 */
export const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, config.JWT_REFRESH_TOKEN_SECRET);
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
}