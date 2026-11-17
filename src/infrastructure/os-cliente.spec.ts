import { OsAuthError } from '../application/ports/os-auth';
import { osAuthClient } from './os-cliente';

describe('osAuthClient', () => {
  beforeEach(() => {
    process.env.OS_BASE_URL = 'http://os.test';
    jest.restoreAllMocks();
  });

  it('unwraps the token from the OS envelope', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { token: 'jwt-assinado-pela-os' } })),
    } as Response);

    await expect(osAuthClient.login('52998224725')).resolves.toBe('jwt-assinado-pela-os');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://os.test/api/v1/auth/cpf',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cpf: '52998224725' }),
      }),
    );
  });

  it('accepts a token without the data envelope', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ token: 'jwt-direto' })),
    } as Response);

    await expect(osAuthClient.login('52998224725')).resolves.toBe('jwt-direto');
  });

  it('maps 401 to OsAuthError', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve(''),
    } as Response);

    await expect(osAuthClient.login('52998224725')).rejects.toBeInstanceOf(OsAuthError);
  });

  it('maps 400 to OsAuthError', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(''),
    } as Response);

    await expect(osAuthClient.login('52998224725')).rejects.toMatchObject({ status: 400 });
  });

  it('fails when the OS cannot be reached', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

    await expect(osAuthClient.login('52998224725')).rejects.toThrow('OS indisponível');
  });

  it('fails on an unexpected HTTP status', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(''),
    } as Response);

    await expect(osAuthClient.login('52998224725')).rejects.toThrow('OS respondeu 500');
  });

  it('fails when the OS body has no token', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: {} })),
    } as Response);

    await expect(osAuthClient.login('52998224725')).rejects.toThrow('Resposta da OS sem token');
  });
});
