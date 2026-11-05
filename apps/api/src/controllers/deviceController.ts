import { Request, Response } from 'express';
import { repo } from '../services/storage/repository';
import { publishCommandToDevice } from '../services/mqtt/mqttService';
import { env } from '../config/env';

export const listDevices = async (req: Request, res: Response): Promise<void> => {
  let devices = await repo.devices.findAll();
  if (devices.length === 0) {
    // Ensure default device exists
    const defaultDev = await repo.devices.getOrCreate(env.DEFAULT_DEVICE_ID);
    devices = [defaultDev];
  }
  res.json({
    success: true,
    data: devices
  });
};

export const getDevice = async (req: Request, res: Response): Promise<void> => {
  const deviceId = req.params.deviceId as string;
  const device = await repo.devices.findByDeviceId(deviceId);
  if (!device) {
    res.status(404).json({
      success: false,
      error: { code: 'DEVICE_NOT_FOUND', message: `Device ${deviceId} not found` }
    });
    return;
  }
  res.json({
    success: true,
    data: device
  });
};

export const getDeviceHealth = async (req: Request, res: Response): Promise<void> => {
  const deviceId = req.params.deviceId as string;
  const device = await repo.devices.findByDeviceId(deviceId);
  const latestTelemetry = await repo.readings.getLatest(deviceId);

  if (!device) {
    res.status(404).json({
      success: false,
      error: { code: 'DEVICE_NOT_FOUND', message: `Device ${deviceId} not found` }
    });
    return;
  }

  const now = Date.now();
  const lastSeenMs = device.lastSeenAt ? new Date(device.lastSeenAt).getTime() : 0;
  const isStale = now - lastSeenMs > env.STALE_DATA_TIMEOUT_MS;

  const sensorHealth = {
    hx711: latestTelemetry ? latestTelemetry.hx711Ready : false,
    weightValid: latestTelemetry ? latestTelemetry.weightValid : false,
    magneticSensor: latestTelemetry ? true : false,
    vibrationSensor: latestTelemetry ? true : false
  };

  res.json({
    success: true,
    data: {
      deviceId,
      connectionStatus: isStale ? 'OFFLINE' : device.connectionStatus,
      isStale,
      lastSeenAt: device.lastSeenAt,
      wifiRssi: device.wifiRssi,
      uptimeSeconds: device.uptimeSeconds,
      firmwareVersion: device.firmwareVersion,
      sensorHealth
    }
  });
};

export const getDeviceSettings = async (req: Request, res: Response): Promise<void> => {
  const deviceId = req.params.deviceId as string;
  const device = await repo.devices.findByDeviceId(deviceId);
  if (!device) {
    res.status(404).json({
      success: false,
      error: { code: 'DEVICE_NOT_FOUND', message: `Device ${deviceId} not found` }
    });
    return;
  }
  res.json({
    success: true,
    data: {
      settings: device.settings,
      capabilities: device.capabilities
    }
  });
};

export const updateDeviceSettings = async (req: Request, res: Response): Promise<void> => {
  const deviceId = req.params.deviceId as string;
  const updatedSettings = req.body;

  const device = await repo.devices.updateSettings(deviceId, updatedSettings);
  if (!device) {
    res.status(404).json({
      success: false,
      error: { code: 'DEVICE_NOT_FOUND', message: `Device ${deviceId} not found` }
    });
    return;
  }

  // Publish updated configuration command to device
  await publishCommandToDevice(
    deviceId,
    'UPDATE_SETTINGS',
    updatedSettings,
    req.user?.email || 'admin'
  );

  res.json({
    success: true,
    data: device.settings,
    message: 'Settings updated on server and command dispatched to device'
  });
};
