import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-dev';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-dev';

export function generateAccessToken(userId: string, role: string, expiresIn = '15m'): string {
  return jwt.sign({ sub: userId, role }, ACCESS_SECRET, { expiresIn } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string): { token: string; jti: string } {
  const jti = uuidv4();
  const token = jwt.sign({ sub: userId, jti }, REFRESH_SECRET, { expiresIn: '7d' });
  return { token, jti };
}

export function verifyAccessToken(token: string): { sub: string; role: string } {
  return jwt.verify(token, ACCESS_SECRET) as { sub: string; role: string };
}

export function verifyRefreshToken(token: string): { sub: string; jti: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string; jti: string };
}
