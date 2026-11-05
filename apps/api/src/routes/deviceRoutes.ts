import { Router } from 'express';
import {
  listDevices,
  getDevice,
  getDeviceHealth,
  getDeviceSettings,
  updateDeviceSettings
} from '../controllers/deviceController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, listDevices);
router.get('/:deviceId', authenticate, getDevice);
router.get('/:deviceId/health', authenticate, getDeviceHealth);
router.get('/:deviceId/settings', authenticate, getDeviceSettings);
router.patch('/:deviceId/settings', authenticate, requireRole(['admin', 'operator']), updateDeviceSettings);

export default router;

