import express from 'express';
import { createService, getServices, getServiceById, updateService, deleteService } from '../../controllers/vendor/serviceController.js';
import { verifyUserToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyUserToken);

router.post('/services', createService);
router.get('/services', getServices);
router.get('/services/:id', getServiceById);
router.patch('/services/:id', updateService);
router.delete('/services/:id', deleteService);

export { router as serviceRoutes };
