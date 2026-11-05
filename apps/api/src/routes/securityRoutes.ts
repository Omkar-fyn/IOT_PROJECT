import { Router } from 'express';
import { getSecurityEvents, acknowledgeEvent } from '../controllers/securityController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:deviceId/events', authenticate, getSecurityEvents);
router.post('/:deviceId/events/:eventId/acknowledge', authenticate, acknowledgeEvent);

export default router;

