import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { repo } from '../services/storage/repository';
import { signToken } from '../utils/jwt';
import { LoginSchema, ChangePasswordSchema } from '@smart-parcel-box/shared';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await repo.users.findByEmail(email);
  if (!user) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    });
    return;
  }

  const token = signToken({
    userId: user._id?.toString() || user.id,
    email: user.email,
    role: user.role
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id?.toString() || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    }
  });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    return;
  }

  const user = await repo.users.findById(req.user.userId);
  if (!user) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    return;
  }

  res.json({
    success: true,
    data: {
      id: user._id?.toString() || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  const user = await repo.users.findById(req.user.userId);
  if (!user) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    return;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Current password does not match' }
    });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(newPassword, salt);
  await repo.users.updatePassword(req.user.userId, newHash);

  res.json({
    success: true,
    message: 'Password successfully updated'
  });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Successfully logged out'
  });
};

