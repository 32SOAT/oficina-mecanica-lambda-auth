import type { AuthTokenPayload } from '../../domain/auth';

export interface TokenSigner {
  sign(payload: AuthTokenPayload): string;
}
