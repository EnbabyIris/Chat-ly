import jwt from 'jsonwebtoken';
import type { TokenPayload } from '@repo/shared/types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateAccessToken = (payload: { userId: string; email: string }): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt.sign as any)(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN });
};

export const generateRefreshToken = (payload: { userId: string; email: string }): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt.sign as any)(payload, JWT_REFRESH_SECRET!, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

export const getTokenExpiration = (expiresIn: string): Date => {
  const now = new Date();
  const match = expiresIn.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error('Invalid expiration format');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return new Date(now.getTime() + value * 1000);
    case 'm':
      return new Date(now.getTime() + value * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default:
      throw new Error('Invalid time unit');
  }
};