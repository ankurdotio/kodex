import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();


/**
 * mounting auth routes
 */
router.use('/auth', authRoutes);


export default router;