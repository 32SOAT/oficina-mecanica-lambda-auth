import type { TokenSigner } from '../application/ports/token-signer';
import type { AuthTokenPayload } from '../domain/auth';
import jwt from 'jsonwebtoken';

function sign(payload: AuthTokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET ausente ou curto demais.');
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '1h') as jwt.SignOptions['expiresIn'];

  return jwt.sign(payload, secret, { expiresIn });
}

export const jwtTokenSigner: TokenSigner = {
  sign,
};
