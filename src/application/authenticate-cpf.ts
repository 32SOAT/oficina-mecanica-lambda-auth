import { OsAuthError, type OsAuthClient } from './ports/os-auth';
import { isValidCpf, normalizeCpf } from '../domain/cpf';

export type AuthFailureReason = 'CpfObrigatorio' | 'CpfInvalido' | 'ClienteInativo';

export type AuthSuccess = {
  ok: true;
  token: string;
};

export type AuthFailure = {
  ok: false;
  reason: AuthFailureReason;
};

export type AuthResult = AuthSuccess | AuthFailure;

export type AuthenticateCpfDeps = {
  osAuth: OsAuthClient;
};

export async function authenticateCpf(
  rawCpf: unknown,
  deps: AuthenticateCpfDeps,
): Promise<AuthResult> {
  if (typeof rawCpf !== 'string' || rawCpf.trim() === '') {
    return { ok: false, reason: 'CpfObrigatorio' };
  }

  const cpf = normalizeCpf(rawCpf);

  if (!isValidCpf(cpf)) {
    return { ok: false, reason: 'CpfInvalido' };
  }

  try {
    const token = await deps.osAuth.login(cpf);
    return { ok: true, token };
  } catch (error) {
    if (error instanceof OsAuthError && error.status === 401) {
      return { ok: false, reason: 'ClienteInativo' };
    }
    if (error instanceof OsAuthError && error.status === 400) {
      return { ok: false, reason: 'CpfInvalido' };
    }
    throw error;
  }
}
