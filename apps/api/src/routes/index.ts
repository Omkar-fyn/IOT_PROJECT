import { Router } from 'express';
import authRoutes from './authRoutes';
import deviceRoutes from './deviceRoutes';
import telemetryRoutes from './telemetryRoutes';
import parcelRoutes from './parcelRoutes';
import securityRoutes from './securityRoutes';
import commandRoutes from './commandRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/parcels', parcelRoutes);
router.use('/security', securityRoutes);
router.use('/commands', commandRoutes);

export default router;

