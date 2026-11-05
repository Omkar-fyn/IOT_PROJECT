import { Router } from 'express';
import { sendCommand, getCommandHistory } from '../controllers/commandController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { CommandTypeSchema } from '@smart-parcel-box/shared';

const router = Router();

const SendCommandSchema = z.object({
  commandType: CommandTypeSchema,
  payload: z.record(z.any()).optional()
});

router.post(
  '/:deviceId',
  authenticate,
  requireRole(['admin', 'operator']),
  validate({ body: SendCommandSchema }),
  sendCommand
);

router.get('/:deviceId', authenticate, getCommandHistory);

export default router;

