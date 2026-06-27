import * as authUtils from '../utils/auth.utils.js';


/**
 * Middleware to authenticate a user based on the provided access token in the request headers.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the user is authenticated or returns an error response.
 */
export const authUser = async (req, res, next) => {

    const accessToken = req.headers[ 'authorization' ]?.split(' ')[ 1 ];

    if (!accessToken) {
        return res.status(401).json({ message: 'Access token is missing' });
    }

    try {
        const decoded = authUtils.verifyAccessToken(accessToken);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid access token' });
    }
}
