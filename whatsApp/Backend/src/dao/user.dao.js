import userModel from '../models/user.model.js';


/**
 * Creates a new user with the provided username, email, and password.
 * @param {Object} params - The parameters for creating a user.
 * @param {string} params.username - The username of the user.
 * @param {string} params.email - The email of the user.
 * @param {string} params.password - The password of the user.
 * @returns {Promise<Object>} - The created user object.
 */
export const createUser = async ({ username, email, password }) => {
    const user = await userModel.create({ username, email, password });

    return user;
}



/**
 * Retrieves a user by the provided email or username.
 * @param {Object} params - The parameters for retrieving a user.
 * @param {string} params.email - The email of the user.
 * @param {string} params.username - The username of the user.
 * @returns {Promise<Object|null>} - The retrieved user object or null if not found.
 */
export const getUserByEmailOrUsername = async ({ email, username }) => {
    const user = await userModel.findOne({
        $or: [
            { email },
            { username }
        ]
    });

    return user;
}


/**
 * Retrieves a user by the provided userId.
 * @param {string} userId - The ID of the user to retrieve.
 * @returns {Promise<Object|null>} - The retrieved user object or null if not found.
 */
export const getUserById = async (userId) => {
    const user = await userModel.findById(userId);
    return user;
}