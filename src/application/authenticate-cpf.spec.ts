import { OsAuthError } from './ports/os-auth';
import type { AuthenticateCpfDeps } from './authenticate-cpf';
import { authenticateCpf } from './authenticate-cpf';

const validCpf = '529.982.247-25';

function deps(overrides: Partial<AuthenticateCpfDeps> = {}): AuthenticateCpfDeps {
  return {
    osAuth: overrides.osAuth ?? { login: jest.fn() },
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
        osAuth: {
          login: jest.fn().mockRejectedValue(new OsAuthError(401, 'http://os.test/api/v1/auth/cpf')),
        },
      }),
    );

    expect(result).toEqual({ ok: false, reason: 'ClienteInativo' });
  });

  it('repassa CPF inválido recusado pela OS', async () => {
    const result = await authenticateCpf(
      validCpf,
      deps({
        osAuth: {
          login: jest.fn().mockRejectedValue(new OsAuthError(400, 'http://os.test/api/v1/auth/cpf')),
        },
      }),
    );

    expect(result).toEqual({ ok: false, reason: 'CpfInvalido' });
  });

  it('devolve o token assinado pela OS', async () => {
    const login = jest.fn().mockResolvedValue('jwt-assinado-pela-os');
    const result = await authenticateCpf(validCpf, deps({ osAuth: { login } }));

    expect(result).toEqual({ ok: true, token: 'jwt-assinado-pela-os' });
    expect(login).toHaveBeenCalledWith('52998224725');
  });

  it('propaga falha que não é recusa de CPF', async () => {
    await expect(
      authenticateCpf(
        validCpf,
        deps({
          osAuth: { login: jest.fn().mockRejectedValue(new Error('OS indisponível')) },
        }),
      ),
    ).rejects.toThrow('OS indisponível');
  });
});
