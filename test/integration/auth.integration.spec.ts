import http from 'node:http';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { AddressInfo } from 'node:net';
import { handler } from '../../src/handler';

const validCpf = '529.982.247-25';
const documento = '52998224725';

function postEvent(body: unknown): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'POST /auth/cpf',
    rawPath: '/auth/cpf',
    rawQueryString: '',
    headers: { 'content-type': 'application/json' },
    requestContext: {
      accountId: 'local',
      apiId: 'local',
      domainName: 'localhost',
      domainPrefix: 'local',
      http: {
        method: 'POST',
        path: '/auth/cpf',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest-integration',
      },
      requestId: 'integration-req',
      routeKey: 'POST /auth/cpf',
      stage: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
}

describe('auth integration', () => {
  let server: http.Server;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { cpf?: string };
        if (req.url !== '/api/v1/auth/cpf' || body.cpf !== documento) {
          res.statusCode = 401;
          res.end(JSON.stringify({ message: 'Cliente não encontrado ou inativo.' }));
          return;
        }
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: { token: 'jwt-assinado-pela-os' } }));
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const address = server.address() as AddressInfo;
    process.env.OS_BASE_URL = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('devolve o token assinado pela OS', async () => {
    const response = await handler(postEvent({ cpf: validCpf }));

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body ?? '')).toEqual({ token: 'jwt-assinado-pela-os' });
  });

  it('retorna 401 para CPF válido sem cadastro', async () => {
    const response = await handler(postEvent({ cpf: '111.444.777-35' }));

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body ?? '')).toEqual({
      message: 'Cliente não encontrado ou inativo.',
    });
  });
});
