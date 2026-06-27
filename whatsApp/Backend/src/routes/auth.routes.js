import * as authController from '../controllers/auth.controller.js';
import { Router } from 'express';
import * as authValidator from '../validator/auth.validator.js';


const authRouter = Router();



/**
 * Route for user registration.
 * @name POST /api/auth/register
 * @public
 */
authRouter.post('/register', authValidator.registerUserValidator, authController.registerUser);


/**
 * Route for user login.
 * @name POST /api/auth/login
 * @public
 */
authRouter.post('/login', authValidator.loginUserValidator, authController.loginUser);



/**
 * Route for user logout.
 * @name POST /api/auth/logout
 * @public
 */
authRouter.post('/logout', authController.logoutUser);



/**
 * Route for refreshing access token and refresh token.
 * @name POST /api/auth/refresh-token
 * @public
 */
authRouter.post('/refresh-token', authController.refreshTokenController);



export default authRouter;