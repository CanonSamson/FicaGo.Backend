import express from 'express';
import { createService, getServices } from '../../controllers/vendor/serviceController.js';
import { verifyUserToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyUserToken);

router.post('/services', createService);
router.get('/services', getServices);

export { router as serviceRoutes };
