import { Pool } from 'pg';
import { postgresClienteRepository, resetPoolForTests } from './db';

jest.mock('pg');

const MockedPool = Pool as jest.MockedClass<typeof Pool>;

describe('postgresClienteRepository', () => {
  let query: jest.Mock;
  let end: jest.Mock;

  beforeEach(async () => {
    await resetPoolForTests();
    query = jest.fn();
    end = jest.fn().mockResolvedValue(undefined);
    MockedPool.mockImplementation(
      () =>
        ({
          query,
          end,
        }) as never,
    );

    process.env.POSTGRES_HOST = 'localhost';
    process.env.POSTGRES_PORT = '5432';
    process.env.POSTGRES_USER = 'oficina';
    process.env.POSTGRES_PASSWORD = 'oficina123';
    process.env.POSTGRES_DB = 'oficina_mecanica';
    process.env.POSTGRES_SSL = '0';
  });

  afterEach(async () => {
    await resetPoolForTests();
    jest.clearAllMocks();
  });

  it('devolve null quando cliente não existe', async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(postgresClienteRepository.findByCpf('52998224725')).resolves.toBeNull();
  });

  it('mapeia cliente encontrado', async () => {
    query.mockResolvedValue({
      rows: [
        {
          id: 'cliente-1',
          documento: '52998224725',
          deleted_at: null,
        },
      ],
    });

    await expect(postgresClienteRepository.findByCpf('52998224725')).resolves.toEqual({
      id: 'cliente-1',
      documento: '52998224725',
      deletedAt: null,
    });
  });

  it('reutiliza o pool entre chamadas', async () => {
    query.mockResolvedValue({ rows: [] });

    await postgresClienteRepository.findByCpf('52998224725');
    await postgresClienteRepository.findByCpf('11144477735');

    expect(MockedPool).toHaveBeenCalledTimes(1);
  });

  it('configura SSL quando POSTGRES_SSL=1', async () => {
    process.env.POSTGRES_SSL = '1';
    process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED = '0';
    query.mockResolvedValue({ rows: [] });

    await postgresClienteRepository.findByCpf('52998224725');

    expect(MockedPool).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: { rejectUnauthorized: false },
      }),
    );
  });
});
