import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { seedInitialAdminAndDevice } from '../scripts/seed';
import { repo } from '../services/storage/repository';

const app = createApp();

describe('Smart Parcel Box REST API Endpoints', () => {
  let authToken = '';

  beforeAll(async () => {
    await seedInitialAdminAndDevice();
  });

  it('GET /api/health should return system status UP', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.services.database).toBeDefined();
  });

  it('POST /api/v1/auth/login should authenticate seeded admin user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@parcelbox.local',
      password: 'Admin@Secure2026'
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@parcelbox.local');

    authToken = res.body.data.token;
  });

  it('POST /api/v1/auth/login with wrong password should return 401', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@parcelbox.local',
      password: 'WrongPassword123'
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/devices without token should return 401', async () => {
    const res = await request(app).get('/api/v1/devices');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/devices with valid token should return device list', async () => {
    const res = await request(app)
      .get('/api/v1/devices')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].deviceId).toBe('BOX-001');
  });

  it('GET /api/v1/devices/BOX-001/health should return health and sensor states', async () => {
    const res = await request(app)
      .get('/api/v1/devices/BOX-001/health')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deviceId).toBe('BOX-001');
    expect(res.body.data.sensorHealth).toBeDefined();
  });

  it('POST /api/v1/commands/BOX-001 should reject DISARM if device capability is false', async () => {
    const res = await request(app)
      .post('/api/v1/commands/BOX-001')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        commandType: 'DISARM_SYSTEM'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CAPABILITY_NOT_SUPPORTED');
  });

  it('POST /api/v1/commands/BOX-001 with ARM_SYSTEM should be accepted', async () => {
    const res = await request(app)
      .post('/api/v1/commands/BOX-001')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        commandType: 'ARM_SYSTEM'
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.commandType).toBe('ARM_SYSTEM');
  });
});

