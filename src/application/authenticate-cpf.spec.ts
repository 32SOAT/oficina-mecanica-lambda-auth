import type { AuthenticateCpfDeps } from './authenticate-cpf';
import { authenticateCpf } from './authenticate-cpf';

const validCpf = '529.982.247-25';
const normalized = '52998224725';

function deps(overrides: Partial<AuthenticateCpfDeps> = {}): AuthenticateCpfDeps {
  return {
    clienteRepository: overrides.clienteRepository ?? { findByCpf: jest.fn() },
    tokenSigner: overrides.tokenSigner ?? { sign: jest.fn() },
  };
}

describe('authenticateCpf', () => {
  it('recusa CPF vazio', async () => {
    const result = await authenticateCpf('', deps());

    expect(result).toEqual({ ok: false, reason: 'CpfObrigatorio' });
  });

  it('recusa CPF inválido', async () => {
    const result = await authenticateCpf('111.111.111-11', deps());

    expect(result).toEqual({ ok: false, reason: 'CpfInvalido' });
  });

  it('recusa cliente inexistente', async () => {
    const result = await authenticateCpf(
      validCpf,
      deps({
        clienteRepository: {
          findByCpf: jest.fn().mockResolvedValue(null),
        },
      }),
    );

    expect(result).toEqual({ ok: false, reason: 'ClienteInativo' });
  });

  it('recusa cliente inativo (deleted_at)', async () => {
    const result = await authenticateCpf(
      validCpf,
      deps({
        clienteRepository: {
          findByCpf: jest.fn().mockResolvedValue({
            id: 'cliente-1',
            documento: normalized,
            deletedAt: new Date('2026-01-01'),
          }),
        },
      }),
    );

    expect(result).toEqual({ ok: false, reason: 'ClienteInativo' });
  });

  it('emite JWT para cliente ativo', async () => {
    const sign = jest.fn().mockReturnValue('jwt-token');
    const result = await authenticateCpf(
      validCpf,
      deps({
        clienteRepository: {
          findByCpf: jest.fn().mockResolvedValue({
            id: 'cliente-1',
            documento: normalized,
            deletedAt: null,
          }),
        },
        tokenSigner: { sign },
      }),
    );

    expect(result).toEqual({ ok: true, token: 'jwt-token' });
    expect(sign).toHaveBeenCalledWith({
      sub: 'cliente-1',
      cpf: normalized,
      role: 'cliente',
    });
  });
});
