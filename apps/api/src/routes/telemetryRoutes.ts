import { Router } from 'express';
import { getLatestTelemetry, getTelemetryHistory } from '../controllers/telemetryController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:deviceId/latest', authenticate, getLatestTelemetry);
router.get('/:deviceId', authenticate, getTelemetryHistory);

export default router;

