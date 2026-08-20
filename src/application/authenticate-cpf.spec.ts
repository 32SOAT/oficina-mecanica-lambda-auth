import { authenticateCpf } from './authenticate-cpf';

const validCpf = '529.982.247-25';
const normalized = '52998224725';

describe('authenticateCpf', () => {
  it('recusa CPF vazio', async () => {
    const result = await authenticateCpf('', {
      findClienteByCpf: jest.fn(),
      signToken: jest.fn(),
    });

    expect(result).toEqual({
      ok: false,
      statusCode: 400,
      message: 'CPF é obrigatório.',
    });
  });

  it('recusa CPF inválido', async () => {
    const result = await authenticateCpf('111.111.111-11', {
      findClienteByCpf: jest.fn(),
      signToken: jest.fn(),
    });

    expect(result).toEqual({
      ok: false,
      statusCode: 400,
      message: 'CPF inválido.',
    });
  });

  it('recusa cliente inexistente', async () => {
    const result = await authenticateCpf(validCpf, {
      findClienteByCpf: jest.fn().mockResolvedValue(null),
      signToken: jest.fn(),
    });

    expect(result).toEqual({
      ok: false,
      statusCode: 401,
      message: 'Cliente não encontrado ou inativo.',
    });
  });

  it('recusa cliente inativo (deleted_at)', async () => {
    const result = await authenticateCpf(validCpf, {
      findClienteByCpf: jest.fn().mockResolvedValue({
        id: 'cliente-1',
        documento: normalized,
        deletedAt: new Date('2026-01-01'),
      }),
      signToken: jest.fn(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.statusCode).toBe(401);
    }
  });

  it('emite JWT para cliente ativo', async () => {
    const signToken = jest.fn().mockReturnValue('jwt-token');
    const result = await authenticateCpf(validCpf, {
      findClienteByCpf: jest.fn().mockResolvedValue({
        id: 'cliente-1',
        documento: normalized,
        deletedAt: null,
      }),
      signToken,
    });

    expect(result).toEqual({ ok: true, token: 'jwt-token' });
    expect(signToken).toHaveBeenCalledWith({
      sub: 'cliente-1',
      cpf: normalized,
      role: 'cliente',
    });
  });
});
