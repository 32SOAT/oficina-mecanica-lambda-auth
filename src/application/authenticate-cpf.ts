import type { ClienteRepository } from './ports/cliente-repository';
import type { TokenSigner } from './ports/token-signer';
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
  clienteRepository: ClienteRepository;
  tokenSigner: TokenSigner;
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

  const cliente = await deps.clienteRepository.findByCpf(cpf);

  if (!cliente || cliente.deletedAt !== null) {
    return { ok: false, reason: 'ClienteInativo' };
  }

  const token = deps.tokenSigner.sign({
    sub: cliente.id,
    cpf: cliente.documento,
    role: 'cliente',
  });

  return { ok: true, token };
}
