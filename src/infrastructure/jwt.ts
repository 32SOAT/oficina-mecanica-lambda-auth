import jwt from 'jsonwebtoken';
import type { AuthTokenPayload } from '../domain/auth';

export function signToken(payload: AuthTokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET ausente ou curto demais.');
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '1h') as jwt.SignOptions['expiresIn'];

  return jwt.sign(payload, secret, { expiresIn });
}
