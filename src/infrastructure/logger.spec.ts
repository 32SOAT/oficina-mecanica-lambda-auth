import { logStructured } from './logger';

describe('logStructured', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('escreve log info em JSON', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    logStructured('auth_cpf', { status: 200, requestId: 'req-1' });

    expect(log).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(log.mock.calls[0][0])) as {
      level: string;
      event: string;
      status: number;
      requestId: string;
      timestamp: string;
    };

    expect(payload).toMatchObject({
      level: 'info',
      event: 'auth_cpf',
      status: 200,
      requestId: 'req-1',
    });
    expect(payload.timestamp).toBeTruthy();
  });

  it('escreve log error em JSON', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    logStructured('auth_cpf_error', { status: 503 }, 'error');

    expect(error).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(error.mock.calls[0][0])) as {
      level: string;
      event: string;
    };

    expect(payload).toMatchObject({
      level: 'error',
      event: 'auth_cpf_error',
    });
  });
});
