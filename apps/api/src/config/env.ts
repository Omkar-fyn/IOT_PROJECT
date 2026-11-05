import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load from workspace root or local
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/smart_parcel_box'),
  JWT_SECRET: z.string().min(16).default('smart-parcel-box-jwt-secret-key-32chars-min!'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  MQTT_BROKER_URL: z.string().default('mqtt://localhost:1883'),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  MQTT_CLIENT_ID: z.string().default('spb_backend_service'),
  DEFAULT_DEVICE_ID: z.string().default('BOX-001'),
  STALE_DATA_TIMEOUT_MS: z.coerce.number().default(15000),
  EMBEDDED_BROKER_PORT: z.coerce.number().default(1883)
});

export const env = envSchema.parse(process.env);

