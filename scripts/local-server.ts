import http from 'node:http';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../src/handler';

const PORT = Number(process.env.PORT ?? 3000);

function toLambdaEvent(req: http.IncomingMessage, body: string): APIGatewayProxyEventV2 {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  return {
    version: '2.0',
    routeKey: `${req.method} ${url.pathname}`,
    rawPath: url.pathname,
    rawQueryString: url.search.slice(1),
    headers: Object.fromEntries(
      Object.entries(req.headers).flatMap(([key, value]) => {
        if (value === undefined) {
          return [];
        }

        return [[key, Array.isArray(value) ? value[0] : value]];
      }),
    ),
    requestContext: {
      accountId: 'local',
      apiId: 'local',
      domainName: 'localhost',
      domainPrefix: 'local',
      http: {
        method: req.method ?? 'GET',
        path: url.pathname,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: req.headers['user-agent'] ?? '',
      },
      requestId: 'local-request',
      routeKey: `${req.method} ${url.pathname}`,
      stage: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    body,
    isBase64Encoded: false,
  };
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks).toString('utf8');
}

const server = http.createServer(async (req, res) => {
  try {
    const body = await readBody(req);
    const event = toLambdaEvent(req, body);
    const result = await handler(event);

    res.statusCode = result.statusCode ?? 500;

    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      }
    }

    res.end(result.body ?? '');
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ message: 'Erro interno.' }));
  }
});

server.listen(PORT, () => {
  console.log(`Auth local em http://localhost:${PORT}/auth/cpf`);
});
