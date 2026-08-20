import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { authenticateCpf } from './application/authenticate-cpf';
import { findClienteByCpf } from './infrastructure/db';
import { signToken } from './infrastructure/jwt';
import { logStructured } from './infrastructure/logger';

const corsHeaders = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type,authorization',
};

function json(statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

function parseBody(event: APIGatewayProxyEventV2): { cpf?: unknown } {
  if (!event.body) {
    return {};
  }

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  try {
    return JSON.parse(raw) as { cpf?: unknown };
  } catch {
    return {};
  }
}

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const method = event.requestContext.http.method;
  const requestId = event.requestContext.requestId;

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (method !== 'POST') {
    logStructured('auth_cpf', { status: 405, requestId, method });
    return json(405, { message: 'Use POST /auth/cpf' });
  }

  const { cpf } = parseBody(event);

  try {
    const result = await authenticateCpf(cpf, {
      findClienteByCpf,
      signToken,
    });

    if (!result.ok) {
      logStructured('auth_cpf', { status: result.statusCode, requestId });
      return json(result.statusCode, { message: result.message });
    }

    logStructured('auth_cpf', { status: 200, requestId });
    return json(200, { token: result.token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';

    logStructured(
      'auth_cpf_error',
      {
        status: 503,
        requestId,
        error: message,
      },
      'error',
    );

    return json(503, { message: 'Serviço temporariamente indisponível.' });
  }
}
