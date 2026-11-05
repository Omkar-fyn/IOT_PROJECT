import { Request, Response } from 'express';
import { repo } from '../services/storage/repository';
import { env } from '../config/env';

export const getLatestTelemetry = async (req: Request, res: Response): Promise<void> => {
  const deviceId = req.params.deviceId as string;
  const reading = await repo.readings.getLatest(deviceId);
  
  if (!reading) {
    res.json({
      success: true,
      data: null,
      message: 'No telemetry recorded yet for this device'
    });
    return;
  }

  const now = Date.now();
  const receivedAtMs = new Date(reading.receivedAt).getTime();
  const isStale = now - receivedAtMs > env.STALE_DATA_TIMEOUT_MS;

  res.json({
    success: true,
    data: {
      ...reading,
      isStale
    }
  });
};

export const getTelemetryHistory = async (req: Request, res: Response): Promise<void> => {
  const deviceId = req.params.deviceId as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
  const startTime = req.query.startTime ? new Date(req.query.startTime as string) : undefined;
  const endTime = req.query.endTime ? new Date(req.query.endTime as string) : undefined;

  const readings = await repo.readings.findHistory(deviceId, limit, startTime, endTime);

  res.json({
    success: true,
    data: readings,
    count: readings.length
  });
};
