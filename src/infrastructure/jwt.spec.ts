import { jwtTokenSigner } from './jwt';

describe('jwtTokenSigner', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpires = process.env.JWT_EXPIRES_IN;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
    process.env.JWT_EXPIRES_IN = originalExpires;
  });

  it('assina payload com JWT válido', () => {
    process.env.JWT_SECRET = 'troque-este-jwt-secret-com-mais-de-16-caracteres';
    process.env.JWT_EXPIRES_IN = '1h';

    const token = jwtTokenSigner.sign({
      sub: 'cliente-1',
      cpf: '52998224725',
      role: 'cliente',
    });

    expect(token.split('.')).toHaveLength(3);
  });

  it('falha quando JWT_SECRET está ausente', () => {
    delete process.env.JWT_SECRET;

    expect(() =>
      jwtTokenSigner.sign({
        sub: 'cliente-1',
        cpf: '52998224725',
        role: 'cliente',
      }),
    ).toThrow('JWT_SECRET ausente ou curto demais.');
  });

  it('falha quando JWT_SECRET é curto', () => {
    process.env.JWT_SECRET = 'curto';

    expect(() =>
      jwtTokenSigner.sign({
        sub: 'cliente-1',
        cpf: '52998224725',
        role: 'cliente',
      }),
    ).toThrow('JWT_SECRET ausente ou curto demais.');
  });
});
