import mqtt, { MqttClient } from 'mqtt';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { repo } from '../storage/repository';
import {
  TelemetryPayloadSchema,
  SecurityEventPayloadSchema,
  ParcelEventPayloadSchema,
  CommandAckPayloadSchema,
  MQTT_TOPICS
} from '@smart-parcel-box/shared';
import {
  broadcastTelemetry,
  broadcastSecurityEvent,
  broadcastParcelEvent,
  broadcastDeviceStatus,
  broadcastAlarmState,
  broadcastCommandAck
} from '../../sockets/socketServer';
import { startEmbeddedBroker } from './embeddedBroker';

let client: MqttClient | null = null;
const processedEvents = new Set<string>();

export const initMqttService = async (): Promise<MqttClient | null> => {
  // Attempt to start embedded broker if port 1883 is free
  await startEmbeddedBroker(env.EMBEDDED_BROKER_PORT);

  const options: mqtt.IClientOptions = {
    clientId: `${env.MQTT_CLIENT_ID}_${Math.random().toString(16).substring(2, 8)}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 5000
  };

  if (env.MQTT_USERNAME && env.MQTT_PASSWORD) {
    options.username = env.MQTT_USERNAME;
    options.password = env.MQTT_PASSWORD;
  }

  logger.info(`Connecting MQTT client to broker: ${env.MQTT_BROKER_URL}...`);
  client = mqtt.connect(env.MQTT_BROKER_URL, options);

  client.on('connect', () => {
    logger.info(`MQTT client successfully connected to ${env.MQTT_BROKER_URL}`);

    // Subscribe to all parcelbox topics using wildcards
    const topics = [
      MQTT_TOPICS.wildcardTelemetry,
      MQTT_TOPICS.wildcardEvents,
      MQTT_TOPICS.wildcardStatus,
      MQTT_TOPICS.wildcardCommandAcks
    ];

    client?.subscribe(topics, { qos: 1 }, (err) => {
      if (err) {
        logger.error('Failed to subscribe to MQTT topics:', err);
      } else {
        logger.info(`Subscribed to topics: ${topics.join(', ')}`);
      }
    });
  });

  client.on('message', async (topic: string, messageBuffer: Buffer) => {
    try {
      const messageStr = messageBuffer.toString('utf8');
      const payload = JSON.parse(messageStr);
      await handleIncomingMqttMessage(topic, payload);
    } catch (err: any) {
      logger.error(`Error processing MQTT message on topic ${topic}:`, err.message);
    }
  });

  client.on('error', (err) => {
    logger.warn(`MQTT client error: ${err.message}`);
  });

  client.on('reconnect', () => {
    logger.info('MQTT client attempting reconnection...');
  });

  return client;
};

export const handleIncomingMqttMessage = async (topic: string, rawPayload: any) => {
  // Topic pattern: parcelbox/{deviceId}/{subtopic}
  const parts = topic.split('/');
  if (parts.length < 3 || parts[0] !== 'parcelbox') {
    logger.warn(`Ignored message from unexpected topic: ${topic}`);
    return;
  }

  const topicDeviceId = parts[1];
  const subtopic = parts[2];

  // 1. DEVICE STATUS (LWT or online broadcast)
  if (subtopic === 'status') {
    const status = rawPayload.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE';
    await repo.devices.updateStatus(topicDeviceId, status, {
      wifiRssi: rawPayload.wifiRssi,
      firmwareVersion: rawPayload.firmwareVersion,
      uptimeSeconds: rawPayload.uptimeSeconds
    });

    broadcastDeviceStatus(topicDeviceId, {
      deviceId: topicDeviceId,
      status,
      timestamp: rawPayload.timestamp || new Date().toISOString()
    });
    logger.info(`Device ${topicDeviceId} status updated to: ${status}`);
    return;
  }

  // Verify deviceId in topic matches payload
  if (rawPayload.deviceId && rawPayload.deviceId !== topicDeviceId) {
    logger.error(`Security mismatch: topic deviceId '${topicDeviceId}' does not match payload deviceId '${rawPayload.deviceId}'`);
    return;
  }

  // 2. TELEMETRY
  if (subtopic === 'telemetry') {
    const parseResult = TelemetryPayloadSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      logger.warn(`Invalid telemetry payload rejected:`, parseResult.error.format());
      return;
    }

    const telemetry = parseResult.data;
    
    // Save to database
    await repo.readings.insert(telemetry);

    // Update device lastSeen and online status
    await repo.devices.updateStatus(telemetry.deviceId, 'ONLINE', {
      wifiRssi: telemetry.wifiRssi,
      firmwareVersion: telemetry.firmwareVersion,
      uptimeSeconds: telemetry.uptimeSeconds
    });

    // Broadcast live telemetry
    broadcastTelemetry(telemetry.deviceId, telemetry);

    // If alarm state is active, also broadcast alarm state
    if (telemetry.alarmActive) {
      broadcastAlarmState(telemetry.deviceId, {
        alarmActive: true,
        armed: telemetry.armed,
        timestamp: telemetry.timestamp
      });
    }
    return;
  }

  // 3. EVENTS
  if (subtopic === 'events') {
    // Check if duplicate event
    if (rawPayload.eventId && processedEvents.has(rawPayload.eventId)) {
      logger.debug(`Duplicate event ${rawPayload.eventId} ignored.`);
      return;
    }

    if (rawPayload.eventType === 'PARCEL_DETECTED' || rawPayload.eventType === 'PARCEL_REMOVED') {
      const parcelParse = ParcelEventPayloadSchema.safeParse(rawPayload);
      if (parcelParse.success) {
        const pEvent = parcelParse.data;
        if (pEvent.eventId) {
          processedEvents.add(pEvent.eventId);
          if (processedEvents.size > 1000) processedEvents.delete(processedEvents.keys().next().value!);
        }
        await repo.parcels.insert(pEvent);
        broadcastParcelEvent(pEvent.deviceId, pEvent);
        logger.info(`Parcel event recorded: ${pEvent.eventType} on ${pEvent.deviceId} (${pEvent.weightGrams}g)`);
      }
    }

    // Security Event
    const secParse = SecurityEventPayloadSchema.safeParse(rawPayload);
    if (secParse.success) {
      const sEvent = secParse.data;
      if (sEvent.eventId) {
        processedEvents.add(sEvent.eventId);
        if (processedEvents.size > 1000) processedEvents.delete(processedEvents.keys().next().value!);
      }
      await repo.security.insert(sEvent);
      broadcastSecurityEvent(sEvent.deviceId, sEvent);
      logger.warn(`Security Event: [${sEvent.severity}] ${sEvent.eventType} on ${sEvent.deviceId}: ${sEvent.description}`);
    } else {
      logger.warn('Event payload failed validation schema:', secParse.error.format());
    }
    return;
  }

  // 4. COMMAND ACKNOWLEDGEMENTS
  if (subtopic === 'command-acks') {
    const ackParse = CommandAckPayloadSchema.safeParse(rawPayload);
    if (!ackParse.success) {
      logger.warn('Invalid command ack payload:', ackParse.error.format());
      return;
    }

    const ack = ackParse.data;
    const status = ack.status === 'SUCCESS' ? 'ACKNOWLEDGED' : ack.status === 'REJECTED_UNSUPPORTED' ? 'REJECTED' : 'FAILED';
    await repo.commands.updateAck(ack.commandId, status, ack.message);
    broadcastCommandAck(ack.deviceId, ack);
    logger.info(`Command ack received for ${ack.commandId}: ${ack.status} - ${ack.message}`);
  }
};

export const publishCommandToDevice = async (
  deviceId: string,
  commandType: string,
  payload: Record<string, any>,
  requestedBy: string
): Promise<{ commandId: string; dispatched: boolean }> => {
  const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  // Record command in database
  await repo.commands.insert({
    commandId,
    deviceId,
    commandType,
    payload,
    requestedBy
  });

  const commandPayload = {
    commandId,
    deviceId,
    commandType,
    payload,
    requestedBy,
    timestamp: new Date().toISOString()
  };

  const topic = MQTT_TOPICS.commands(deviceId);

  if (client && client.connected) {
    client.publish(topic, JSON.stringify(commandPayload), { qos: 1 }, (err) => {
      if (err) {
        logger.error(`Failed to publish command to ${topic}:`, err);
      } else {
        logger.info(`Command ${commandType} (${commandId}) dispatched to ${topic}`);
      }
    });
    return { commandId, dispatched: true };
  } else {
    logger.warn(`MQTT client not connected. Command ${commandId} queued/recorded as pending.`);
    return { commandId, dispatched: false };
  }
};

export const getMqttStatus = () => ({
  connected: client?.connected || false,
  brokerUrl: env.MQTT_BROKER_URL
});

