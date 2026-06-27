import * as userDao from '../dao/user.dao.js';
import * as sessionDao from '../dao/session.dao.js';
import * as authUtils from '../utils/auth.utils.js';
import config from '../config/config.js';


/**
 * Registers a new user with the provided username, email, and password.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the user is registered.
 */
export const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    const isUserExists = await userDao.getUserByEmailOrUsername({ email, username });

    if (isUserExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await userDao.createUser({ username, email, password });

    const accessToken = authUtils.generateAccessToken(user._id);
    const refreshToken = authUtils.generateRefreshToken(user._id);

    await sessionDao.createSession({ userId: user._id, refreshToken });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
        message: 'User registered successfully',
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            accessToken
        }
    })
}



/**
 * Logs in a user with the provided email and password.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the user is logged in.
 */
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await userDao.getUserByEmailOrUsername({ email });

    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const accessToken = authUtils.generateAccessToken(user._id);
    const refreshToken = authUtils.generateRefreshToken(user._id);


    await sessionDao.updateSessionByUserId(user._id, { refreshToken });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
        message: 'User logged in successfully',
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            accessToken
        }
    })
}



/**
 * Logs out a user by clearing the refresh token cookie and deleting the session.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the user is logged out.
 */
export const logoutUser = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token not found' });
    }

    try {

        const decoded = authUtils.verifyRefreshToken(refreshToken);

        await sessionDao.deleteSessionByUserId(decoded.userId);

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.status(200).json({ message: 'User logged out successfully' });


    } catch (error) {
        return res.status(400).json({ message: 'Invalid or expired refresh token' });
    }

}


/**
 * Refreshes the access token and refresh token using the provided refresh token.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the tokens are refreshed.
 */
export const refreshTokenController = async (req, res) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token not found' });
    }

    try {
        const decoded = authUtils.verifyRefreshToken(refreshToken);

        const session = await sessionDao.getSessionByUserId(decoded.userId);

        if (!session) {
            return res.status(400).json({ message: 'Session not found' });
        }

        const isRefreshTokenValid = session.compareRefreshToken(refreshToken);

        if (!isRefreshTokenValid) {
            return res.status(400).json({ message: 'Invalid refresh token' });
        }

        const newAccessToken = authUtils.generateAccessToken(decoded.userId);
        const newRefreshToken = authUtils.generateRefreshToken(decoded.userId);

        await sessionDao.updateSessionByUserId(decoded.userId, { refreshToken: newRefreshToken });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            message: 'Tokens refreshed successfully',
            data: {
                accessToken: newAccessToken
            }
        })
    } catch (error) {
        return res.status(400).json({ message: 'Invalid or expired refresh token' });
    }

}



/**
 * function for get me 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the user data is retrieved.
 */
export const getMe = async (req, res) => {
    const userId = req.userId;

    const user = await userDao.getUserById(userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
        message: 'User data retrieved successfully',
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        }
    })

}
