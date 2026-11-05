import { Request, Response } from 'express';
import { repo } from '../services/storage/repository';

export const getSecurityEvents = async (req: Request, res: Response): Promise<void> => {
  const deviceId = req.params.deviceId as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const page = parseInt(req.query.page as string) || 1;
  const eventType = req.query.eventType as string | undefined;
  const severity = req.query.severity as string | undefined;

  const result = await repo.security.findHistory(deviceId, { limit, page, eventType, severity });

  res.json({
    success: true,
    data: result.events,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    }
  });
};

export const acknowledgeEvent = async (req: Request, res: Response): Promise<void> => {
  const eventId = req.params.eventId as string;
  const acknowledgedBy = req.user?.email || 'admin';

  const updated = await repo.security.acknowledge(eventId, acknowledgedBy);
  if (!updated) {
    res.status(404).json({
      success: false,
      error: { code: 'EVENT_NOT_FOUND', message: `Event ${eventId} not found` }
    });
    return;
  }

  res.json({
    success: true,
    data: updated,
    message: 'Security event acknowledged successfully'
  });
};
