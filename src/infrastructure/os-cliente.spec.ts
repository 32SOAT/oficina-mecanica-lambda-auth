import { osClienteRepository } from './os-cliente';

describe('osClienteRepository', () => {
  beforeEach(() => {
    process.env.OS_BASE_URL = 'http://os.test';
    process.env.SAGA_TOKEN = 'oficina-local';
    jest.restoreAllMocks();
  });

  it('maps an active client from the OS response', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            data: {
              id: 'cliente-1',
              documento: '52998224725',
              deletedAt: null,
            },
          }),
        ),
    } as Response);

    await expect(osClienteRepository.findByCpf('52998224725')).resolves.toEqual({
      id: 'cliente-1',
      documento: '52998224725',
      deletedAt: null,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://os.test/api/v1/clientes/consulta-auth',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-saga-token': 'oficina-local' }),
      }),
    );
  });

  it('returns null when the OS does not know the document', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve(''),
    } as Response);

    await expect(osClienteRepository.findByCpf('52998224725')).resolves.toBeNull();
  });

  it('fails when the OS cannot be reached', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

    await expect(osClienteRepository.findByCpf('52998224725')).rejects.toThrow(
      'OS indisponível',
    );
  });

  it('fails when the saga token is rejected', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve(''),
    } as Response);

    await expect(osClienteRepository.findByCpf('52998224725')).rejects.toThrow(
      'OS respondeu 401',
    );
  });
});
