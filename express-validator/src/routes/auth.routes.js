import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { registerValidationRules } from '../validation/auth.validator.js';

const authRouter = Router();


/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @argument {req.body.email} - User's email
 * @argument {req.body.contact} - User's contact number
 * @argument {req.body.password} - User's password
 * @access Public
 */
authRouter.post('/register', registerValidationRules, authController.registerUser);

export default authRouter;