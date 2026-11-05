import { Router } from 'express';
import { getCurrentParcel, getParcelEvents } from '../controllers/parcelController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:deviceId/current', authenticate, getCurrentParcel);
router.get('/:deviceId/events', authenticate, getParcelEvents);

export default router;

