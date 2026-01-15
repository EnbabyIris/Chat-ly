import { db, users, refreshTokens } from '../db';
import { eq, and } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, getTokenExpiration, verifyRefreshToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { ERROR_MESSAGES } from '@repo/shared/constants';
import type { RegisterDTO, LoginDTO, AuthResponse } from '@repo/shared/types';

export class AuthService {
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
    });

    if (existingUser) {
      throw new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
      })
      .returning();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: newUser.id,
      email: newUser.email,
    });

    const refreshTokenValue = generateRefreshToken({
      userId: newUser.id,
      email: newUser.email,
    });

    // Store refresh token
    await db.insert(refreshTokens).values({
      userId: newUser.id,
      token: refreshTokenValue,
      expiresAt: getTokenExpiration(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
    });

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        bio: newUser.bio,
        isOnline: newUser.isOnline,
      },
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
    });

    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const isValidPassword = await comparePassword(data.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshTokenValue = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: getTokenExpiration(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
      },
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const storedToken = await db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.token, refreshToken),
        eq(refreshTokens.userId, payload.userId),
      ),
    });

    if (!storedToken) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_TOKEN);
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_TOKEN);
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    return { accessToken };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.token, refreshToken)));
  }

  async getCurrentUser(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false,
      },
    });

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }
}