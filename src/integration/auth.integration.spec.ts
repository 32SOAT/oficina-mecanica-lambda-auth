import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { handler } from '../handler';
import { resetPoolForTests } from '../infrastructure/db';

const validCpf = '529.982.247-25';

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

async function waitForPostgres(maxAttempts = 30): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT ?? '5432'),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      ssl: process.env.POSTGRES_SSL === '1' ? { rejectUnauthorized: false } : undefined,
    });

    try {
      await pool.query('SELECT 1');
      await pool.end();
      return;
    } catch {
      await pool.end().catch(() => undefined);
      if (attempt === maxAttempts) {
        throw new Error('Postgres indisponível para testes de integração.');
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

describe('auth integration', () => {
  beforeAll(async () => {
    await waitForPostgres();
  });

  afterAll(async () => {
    await resetPoolForTests();
  });

  it('autentica cliente seed e devolve JWT válido', async () => {
    const response = await handler(postEvent({ cpf: validCpf }));

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body ?? '') as { token: string };
    expect(body.token).toBeTruthy();

    const payload = jwt.verify(body.token, process.env.JWT_SECRET!) as {
      sub: string;
      cpf: string;
      role: string;
    };

    expect(payload).toMatchObject({
      sub: '550e8400-e29b-41d4-a716-446655440000',
      cpf: '52998224725',
      role: 'cliente',
    });
  });

  it('retorna 401 para CPF válido sem cadastro', async () => {
    const response = await handler(postEvent({ cpf: '111.444.777-35' }));

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body ?? '')).toEqual({
      message: 'Cliente não encontrado ou inativo.',
    });
  });
});
