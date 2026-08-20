import type { AuthTokenPayload, ClienteRecord } from '../domain/auth';
import { isValidCpf, normalizeCpf } from '../domain/cpf';

export type AuthSuccess = {
  ok: true;
  token: string;
};

export type AuthFailure = {
  ok: false;
  statusCode: 400 | 401;
  message: string;
};

export type AuthResult = AuthSuccess | AuthFailure;

export type AuthenticateCpfDeps = {
  findClienteByCpf: (cpf: string) => Promise<ClienteRecord | null>;
  signToken: (payload: AuthTokenPayload) => string;
};

export async function authenticateCpf(
  rawCpf: unknown,
  deps: AuthenticateCpfDeps,
): Promise<AuthResult> {
  if (typeof rawCpf !== 'string' || rawCpf.trim() === '') {
    return { ok: false, statusCode: 400, message: 'CPF é obrigatório.' };
  }

  const cpf = normalizeCpf(rawCpf);

  if (!isValidCpf(cpf)) {
    return { ok: false, statusCode: 400, message: 'CPF inválido.' };
  }

  const cliente = await deps.findClienteByCpf(cpf);

  if (!cliente || cliente.deletedAt !== null) {
    return {
      ok: false,
      statusCode: 401,
      message: 'Cliente não encontrado ou inativo.',
    };
  }

  const token = deps.signToken({
    sub: cliente.id,
    cpf: cliente.documento,
    role: 'cliente',
  });

  return { ok: true, token };
}
