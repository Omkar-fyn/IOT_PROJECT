/**
 * Test client script to probe MQTT broker connection and print incoming telemetry
 */
const mqtt = require('mqtt');

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(BROKER_URL);

console.log(`Connecting test listener to ${BROKER_URL}...`);

client.on('connect', () => {
  console.log('Connected! Subscribing to parcelbox/# topics...');
  client.subscribe('parcelbox/#', (err) => {
    if (err) console.error('Subscription error:', err);
    else console.log('Successfully subscribed. Listening for packets...');
  });
});

client.on('message', (topic, message) => {
  console.log(`\n[TOPIC]: ${topic}`);
  try {
    const json = JSON.parse(message.toString());
    console.log(JSON.stringify(json, null, 2));
  } catch {
    console.log(message.toString());
  }
});

