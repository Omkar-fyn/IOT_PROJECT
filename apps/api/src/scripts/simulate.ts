import mqtt from 'mqtt';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { MQTT_TOPICS } from '@smart-parcel-box/shared';

const DEVICE_ID = 'BOX-001';
let sequence = 1;

interface SimState {
  weightGrams: number;
  weightRaw: number;
  weightValid: boolean;
  hx711Ready: boolean;
  lidClosed: boolean;
  magneticRaw: number;
  vibrationDetected: boolean;
  vibrationRaw: number;
  parcelPresent: boolean;
  armed: boolean;
  alarmActive: boolean;
  redLedActive: boolean;
  greenLedActive: boolean;
  buzzerActive: boolean;
  wifiRssi: number;
  uptimeSeconds: number;
}

const state: SimState = {
  weightGrams: 0,
  weightRaw: 10420,
  weightValid: true,
  hx711Ready: true,
  lidClosed: true,
  magneticRaw: 0,
  vibrationDetected: false,
  vibrationRaw: 0,
  parcelPresent: false,
  armed: true,
  alarmActive: false,
  redLedActive: false,
  greenLedActive: true,
  buzzerActive: false,
  wifiRssi: -58,
  uptimeSeconds: 120
};

export const runSimulator = () => {
  logger.info(`Starting Smart Parcel Box Simulator for device ${DEVICE_ID}...`);
  logger.info(`Connecting to broker ${env.MQTT_BROKER_URL}...`);

  const client = mqtt.connect(env.MQTT_BROKER_URL, {
    clientId: `simulator_${DEVICE_ID}_${Math.random().toString(16).substring(2, 6)}`,
    clean: true,
    will: {
      topic: MQTT_TOPICS.status(DEVICE_ID),
      payload: Buffer.from(
        JSON.stringify({
          schemaVersion: 1,
          deviceId: DEVICE_ID,
          status: 'OFFLINE',
          timestamp: new Date().toISOString()
        })
      ),
      qos: 1,
      retain: true
    }
  });

  const publishTelemetry = () => {
    state.uptimeSeconds += 2;
    const payload = {
      schemaVersion: 1,
      deviceId: DEVICE_ID,
      messageId: `sim_msg_${Date.now()}_${sequence}`,
      sequence: sequence++,
      timestamp: new Date().toISOString(),
      ...state,
      firmwareVersion: '1.0.0-sim',
      isSimulated: true
    };

    client.publish(MQTT_TOPICS.telemetry(DEVICE_ID), JSON.stringify(payload), { qos: 0 });
    logger.debug(`[SIMULATOR] Published Telemetry: ${state.weightGrams}g, Armed: ${state.armed}, Alarm: ${state.alarmActive}`);
  };

  const publishEvent = (eventType: string, severity: 'INFO' | 'WARNING' | 'CRITICAL', description: string, sensor: string, extra?: Record<string, any>) => {
    const payload = {
      schemaVersion: 1,
      eventId: `sim_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      deviceId: DEVICE_ID,
      eventType,
      severity,
      sourceSensor: sensor,
      description,
      timestamp: new Date().toISOString(),
      isSimulated: true,
      ...extra
    };

    client.publish(MQTT_TOPICS.events(DEVICE_ID), JSON.stringify(payload), { qos: 1 });
    logger.info(`[SIMULATOR EVENT] [${severity}] ${eventType}: ${description}`);
  };

  client.on('connect', () => {
    logger.info('Simulator connected to MQTT broker!');

    // Publish online status
    client.publish(
      MQTT_TOPICS.status(DEVICE_ID),
      JSON.stringify({
        schemaVersion: 1,
        deviceId: DEVICE_ID,
        status: 'ONLINE',
        timestamp: new Date().toISOString(),
        firmwareVersion: '1.0.0-sim',
        wifiRssi: -58
      }),
      { qos: 1, retain: true }
    );

    // Subscribe to commands
    client.subscribe(MQTT_TOPICS.commands(DEVICE_ID), (err) => {
      if (!err) logger.info(`Simulator subscribed to incoming commands on ${MQTT_TOPICS.commands(DEVICE_ID)}`);
    });

    // Send initial device online event
    publishEvent('DEVICE_ONLINE', 'INFO', 'Smart Parcel Box ESP32 booted and connected to network', 'SYSTEM');

    // Periodic telemetry every 2 seconds
    setInterval(publishTelemetry, 2000);

    // Cycle through real-world scenarios automatically
    let scenarioStep = 0;
    setInterval(() => {
      scenarioStep = (scenarioStep + 1) % 8;

      switch (scenarioStep) {
        case 1:
          // Courier opens lid
          logger.info('--- SCENARIO: Courier opens box lid ---');
          state.lidClosed = false;
          state.magneticRaw = 1;
          state.armed = false; // Disarmed by authorized delivery or opening
          state.greenLedActive = false;
          publishEvent('LID_OPENED', 'INFO', 'Lid opened for delivery', 'REED_SWITCH');
          break;

        case 2:
          // Courier places a parcel of 1450g
          logger.info('--- SCENARIO: Courier deposits 1450g parcel ---');
          state.weightGrams = 1450;
          state.weightRaw = 1450 * 420 + 10420;
          state.parcelPresent = true;
          state.weightValid = true;
          publishEvent('PARCEL_DETECTED', 'INFO', 'Parcel placed in box (1450g)', 'HX711', { weightGrams: 1450 });
          break;

        case 3:
          // Courier closes lid
          logger.info('--- SCENARIO: Courier closes lid ---');
          state.lidClosed = true;
          state.magneticRaw = 0;
          publishEvent('LID_CLOSED', 'INFO', 'Lid closed securely', 'REED_SWITCH');
          break;

        case 4:
          // System arms after delay
          logger.info('--- SCENARIO: System armed ---');
          state.armed = true;
          state.greenLedActive = true;
          publishEvent('SYSTEM_ARMED', 'INFO', 'Tamper detection armed and active', 'SYSTEM');
          break;

        case 5:
          // Tamper attempt: box is shaken
          logger.info('--- SCENARIO: Tampering detected (SW-420 Vibration) ---');
          state.vibrationDetected = true;
          state.vibrationRaw = 1;
          state.alarmActive = true;
          state.redLedActive = true;
          state.buzzerActive = true;
          publishEvent('VIBRATION_DETECTED', 'WARNING', 'Physical vibration / impact detected on box frame', 'SW-420');
          publishEvent('ALARM_TRIGGERED', 'CRITICAL', 'LOCAL ALARM SOUNDED: Tampering vibration while armed!', 'LOCAL_SECURITY_FSM');
          break;

        case 6:
          // Owner pushes physical button to acknowledge and silence alarm
          logger.info('--- SCENARIO: Owner presses physical button (GPIO 26) to silence alarm ---');
          state.vibrationDetected = false;
          state.vibrationRaw = 0;
          state.alarmActive = false;
          state.buzzerActive = false;
          state.redLedActive = false;
          state.greenLedActive = true;
          publishEvent('ALARM_ACKNOWLEDGED', 'INFO', 'Alarm silenced by physical push button on box', 'PUSH_BUTTON');
          break;

        case 7:
          // Owner retrieves parcel
          logger.info('--- SCENARIO: Owner retrieves parcel ---');
          state.weightGrams = 0;
          state.weightRaw = 10420;
          state.parcelPresent = false;
          publishEvent('PARCEL_REMOVED', 'INFO', 'Parcel removed by owner', 'HX711', { weightGrams: 0 });
          break;
      }
    }, 12000);
  });

  // Handle incoming commands
  client.on('message', (topic, message) => {
    try {
      const cmd = JSON.parse(message.toString());
      logger.info(`[SIMULATOR] Received command: ${cmd.commandType} (${cmd.commandId})`);

      let status = 'SUCCESS';
      let msg = `Executed command ${cmd.commandType}`;

      if (cmd.commandType === 'ARM_SYSTEM') {
        state.armed = true;
        state.greenLedActive = true;
        publishEvent('SYSTEM_ARMED', 'INFO', 'System armed remotely', 'REMOTE_COMMAND');
      } else if (cmd.commandType === 'DISARM_SYSTEM') {
        // Prototype firmware requires physical button for disarm
        status = 'REJECTED_UNSUPPORTED';
        msg = 'Remote disarm disabled in prototype firmware: Physical button required on GPIO 26';
      } else if (cmd.commandType === 'TARE_SCALE') {
        state.weightGrams = 0;
        msg = 'HX711 scale tared successfully to 0g';
      } else if (cmd.commandType === 'ACKNOWLEDGE_ALARM') {
        state.alarmActive = false;
        state.buzzerActive = false;
        state.redLedActive = false;
        msg = 'Alarm acknowledged remotely';
        publishEvent('ALARM_ACKNOWLEDGED', 'INFO', 'Alarm silenced remotely', 'REMOTE_COMMAND');
      }

      // Publish ack
      const ackPayload = {
        schemaVersion: 1,
        commandId: cmd.commandId,
        deviceId: DEVICE_ID,
        commandType: cmd.commandType,
        status,
        message: msg,
        timestamp: new Date().toISOString()
      };

      client.publish(MQTT_TOPICS.commandAcks(DEVICE_ID), JSON.stringify(ackPayload), { qos: 1 });
    } catch (e: any) {
      logger.error('Error handling command in simulator:', e);
    }
  });
};

if (require.main === module) {
  runSimulator();
}

