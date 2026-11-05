import { Request, Response } from 'express';
import { repo } from '../services/storage/repository';
import { publishCommandToDevice } from '../services/mqtt/mqttService';

export const sendCommand = async (req: Request, res: Response): Promise<void> => {
  const deviceId = req.params.deviceId as string;
  const { commandType, payload } = req.body;
  const requestedBy = req.user?.email || 'admin';

  const device = await repo.devices.findByDeviceId(deviceId);
  if (!device) {
    res.status(404).json({
      success: false,
      error: { code: 'DEVICE_NOT_FOUND', message: `Device ${deviceId} not found` }
    });
    return;
  }

  // Capability checks - NEVER pretend remote disarm is functional if hardware lacks verified support!
  if (commandType === 'DISARM_SYSTEM' && !device.capabilities.supportsRemoteDisarm) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CAPABILITY_NOT_SUPPORTED',
        message: 'Remote disarming is currently disabled by device capabilities. Physical push button on box must be pressed to disarm.'
      }
    });
    return;
  }

  const result = await publishCommandToDevice(deviceId, commandType, payload || {}, requestedBy);

  res.status(202).json({
    success: true,
    data: {
      commandId: result.commandId,
      deviceId,
      commandType,
      status: result.dispatched ? 'DISPATCHED' : 'QUEUED',
      message: result.dispatched
        ? 'Command published to MQTT broker. Awaiting device execution and ack.'
        : 'Command recorded as pending (broker currently disconnected).'
    }
  });
};

export const getCommandHistory = async (req: Request, res: Response): Promise<void> => {
  const deviceId = req.params.deviceId as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

  const commands = await repo.commands.findByDevice(deviceId, limit);

  res.json({
    success: true,
    data: commands
  });
};
