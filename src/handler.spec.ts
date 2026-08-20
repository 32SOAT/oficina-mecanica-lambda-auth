import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from './handler';
import { authenticateCpf } from './authenticate-cpf';

jest.mock('./authenticate-cpf');
jest.mock('./db', () => ({
  findClienteByCpf: jest.fn(),
}));
jest.mock('./jwt', () => ({
  signToken: jest.fn(),
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

  it('propaga 401 da autenticação', async () => {
    mockedAuthenticate.mockResolvedValue({
      ok: false,
      statusCode: 401,
      message: 'Cliente não encontrado ou inativo.',
    });

    const response = await handler(postEvent({ cpf: '529.982.247-25' }));

    expect(response.statusCode).toBe(401);
  });
});
