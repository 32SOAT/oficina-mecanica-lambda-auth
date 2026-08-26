import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from './handler';
import { authenticateCpf } from './application/authenticate-cpf';

jest.mock('./application/authenticate-cpf');
jest.mock('./infrastructure/db', () => ({
  postgresClienteRepository: { findByCpf: jest.fn() },
}));
jest.mock('./infrastructure/jwt', () => ({
  jwtTokenSigner: { sign: jest.fn() },
}));
jest.mock('./infrastructure/logger', () => ({
  logStructured: jest.fn(),
}));

const mockedAuthenticate = authenticateCpf as jest.MockedFunction<typeof authenticateCpf>;

function postEvent(body: unknown): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'POST /auth/cpf',
    rawPath: '/auth/cpf',
    rawQueryString: '',
    headers: { 'content-type': 'application/json' },
    requestContext: {
      accountId: '1',
      apiId: 'api',
      domainName: 'example.com',
      domainPrefix: 'example',
      http: {
        method: 'POST',
        path: '/auth/cpf',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest',
      },
      requestId: 'req',
      routeKey: 'POST /auth/cpf',
      stage: '$default',
      time: 'now',
      timeEpoch: 0,
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
}

describe('handler', () => {
  beforeEach(() => {
    mockedAuthenticate.mockReset();
  });

  it('devolve 405 para método diferente de POST', async () => {
    const event = postEvent({});
    event.requestContext.http.method = 'GET';

    const response = await handler(event);

    expect(response.statusCode).toBe(405);
  });

  it('devolve 200 com token', async () => {
    mockedAuthenticate.mockResolvedValue({ ok: true, token: 'abc' });

    const response = await handler(postEvent({ cpf: '529.982.247-25' }));

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body ?? '')).toEqual({ token: 'abc' });
  });

  it('mapeia ClienteInativo para 401', async () => {
    mockedAuthenticate.mockResolvedValue({
      ok: false,
      reason: 'ClienteInativo',
    });

    const response = await handler(postEvent({ cpf: '529.982.247-25' }));

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body ?? '')).toEqual({
      message: 'Cliente não encontrado ou inativo.',
    });
  });

  it('mapeia CpfInvalido para 400', async () => {
    mockedAuthenticate.mockResolvedValue({
      ok: false,
      reason: 'CpfInvalido',
    });

    const response = await handler(postEvent({ cpf: '111.111.111-11' }));

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body ?? '')).toEqual({
      message: 'CPF inválido.',
    });
  });

  it('responde 204 em OPTIONS', async () => {
    const event = postEvent({});
    event.requestContext.http.method = 'OPTIONS';

    const response = await handler(event);

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
  });

  it('aceita body vazio e propaga CpfObrigatorio', async () => {
    mockedAuthenticate.mockResolvedValue({
      ok: false,
      reason: 'CpfObrigatorio',
    });

    const event = postEvent({});
    event.body = undefined;

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body ?? '')).toEqual({
      message: 'CPF é obrigatório.',
    });
  });

  it('aceita JSON inválido como body vazio', async () => {
    mockedAuthenticate.mockResolvedValue({
      ok: false,
      reason: 'CpfObrigatorio',
    });

    const event = postEvent({});
    event.body = '{nao-json';

    const response = await handler(event);

    expect(mockedAuthenticate).toHaveBeenCalledWith(
      undefined,
      expect.anything(),
    );
    expect(response.statusCode).toBe(400);
  });

  it('decodifica body base64', async () => {
    mockedAuthenticate.mockResolvedValue({ ok: true, token: 'abc' });

    const event = postEvent({ cpf: '529.982.247-25' });
    event.isBase64Encoded = true;
    event.body = Buffer.from(JSON.stringify({ cpf: '529.982.247-25' })).toString('base64');

    const response = await handler(event);

    expect(mockedAuthenticate).toHaveBeenCalledWith(
      '529.982.247-25',
      expect.anything(),
    );
    expect(response.statusCode).toBe(200);
  });

  it('devolve 503 quando autenticação lança erro', async () => {
    mockedAuthenticate.mockRejectedValue(new Error('connection refused'));

    const response = await handler(postEvent({ cpf: '529.982.247-25' }));

    expect(response.statusCode).toBe(503);
    expect(JSON.parse(response.body ?? '')).toEqual({
      message: 'Serviço temporariamente indisponível.',
    });
  });

  it('devolve 503 para erro sem mensagem', async () => {
    mockedAuthenticate.mockRejectedValue('falha');

    const response = await handler(postEvent({ cpf: '529.982.247-25' }));

    expect(response.statusCode).toBe(503);
  });
});
