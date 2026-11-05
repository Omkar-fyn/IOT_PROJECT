import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // Allow development frontend
      methods: ['GET', 'POST']
    },
    pingInterval: 10000,
    pingTimeout: 5000
  });

  io.on('connection', (socket: Socket) => {
    logger.debug(`Socket.IO client connected: ${socket.id}`);

    socket.on('join:device', (deviceId: string) => {
      socket.join(`device:${deviceId}`);
      logger.debug(`Socket ${socket.id} joined room device:${deviceId}`);
    });

    socket.on('leave:device', (deviceId: string) => {
      socket.leave(`device:${deviceId}`);
      logger.debug(`Socket ${socket.id} left room device:${deviceId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket.IO client disconnected: ${socket.id} (${reason})`);
    });
  });

  logger.info('Socket.IO real-time server initialized.');
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO server has not been initialized yet');
  }
  return io;
};

export const broadcastTelemetry = (deviceId: string, data: any) => {
  if (!io) return;
  io.to(`device:${deviceId}`).emit('telemetry:update', data);
  io.emit('telemetry:update', data); // Also emit to global dashboard channel
};

export const broadcastSecurityEvent = (deviceId: string, data: any) => {
  if (!io) return;
  io.to(`device:${deviceId}`).emit('security:event', data);
  io.emit('security:event', data);
};

export const broadcastParcelEvent = (deviceId: string, data: any) => {
  if (!io) return;
  io.to(`device:${deviceId}`).emit('parcel:event', data);
  io.emit('parcel:event', data);
};

export const broadcastDeviceStatus = (deviceId: string, statusData: any) => {
  if (!io) return;
  io.to(`device:${deviceId}`).emit('device:status', statusData);
  io.emit('device:status', statusData);
};

export const broadcastAlarmState = (deviceId: string, alarmData: any) => {
  if (!io) return;
  io.to(`device:${deviceId}`).emit('alarm:state', alarmData);
  io.emit('alarm:state', alarmData);
};

export const broadcastCommandAck = (deviceId: string, ackData: any) => {
  if (!io) return;
  io.to(`device:${deviceId}`).emit('command:status', ackData);
  io.emit('command:status', ackData);
};

