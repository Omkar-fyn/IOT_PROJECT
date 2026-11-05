import { Request, Response } from 'express';
import { repo } from '../services/storage/repository';

export const getCurrentParcel = async (req: Request, res: Response): Promise<void> => {
  const deviceId = req.params.deviceId as string;
  const latestTelemetry = await repo.readings.getLatest(deviceId);
  const lastParcelEvent = await repo.parcels.getCurrent(deviceId);

  const parcelPresent = latestTelemetry ? latestTelemetry.parcelPresent : false;
  const currentWeightGrams = latestTelemetry && latestTelemetry.weightValid ? latestTelemetry.weightGrams : 0;

  res.json({
    success: true,
    data: {
      deviceId,
      parcelPresent,
      currentWeightGrams,
      weightValid: latestTelemetry ? latestTelemetry.weightValid : false,
      detectedAt: lastParcelEvent ? lastParcelEvent.receivedAt : null,
      lastEvent: lastParcelEvent
    }
  });
};

export const getParcelEvents = async (req: Request, res: Response): Promise<void> => {
  const deviceId = req.params.deviceId as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

  const events = await repo.parcels.findHistory(deviceId, limit);

  res.json({
    success: true,
    data: events,
    count: events.length
  });
};
