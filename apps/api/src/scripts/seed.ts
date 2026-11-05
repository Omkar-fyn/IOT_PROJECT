import bcrypt from 'bcryptjs';
import { repo } from '../services/storage/repository';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const seedInitialAdminAndDevice = async () => {
  try {
    const adminEmail = 'admin@parcelbox.local';
    const existingAdmin = await repo.users.findByEmail(adminEmail);

    if (!existingAdmin) {
      const defaultPassword = 'Admin@Secure2026';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);

      await repo.users.create({
        name: 'Chief Security Officer',
        email: adminEmail,
        passwordHash,
        role: 'admin'
      });

      logger.info('========================================================');
      logger.info('INITIAL ADMIN USER CREATED:');
      logger.info(`Email:    ${adminEmail}`);
      logger.info(`Password: ${defaultPassword}`);
      logger.info('IMPORTANT: Please change this password upon first login!');
      logger.info('========================================================');
    }

    // Seed default device
    await repo.devices.getOrCreate(env.DEFAULT_DEVICE_ID, {
      deviceName: 'Smart Parcel Box #1',
      deviceType: 'ESP32-SPB',
      firmwareVersion: '1.0.0'
    });
    logger.info(`Default device ${env.DEFAULT_DEVICE_ID} verified in registry.`);
  } catch (error) {
    logger.error('Failed to seed initial admin or device:', error);
  }
};

