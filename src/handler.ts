import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { authenticateCpf } from './authenticate-cpf';
import { findClienteByCpf } from './db';
import { signToken } from './jwt';

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

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (method !== 'POST') {
    return json(405, { message: 'Use POST /auth/cpf' });
  }

  const { cpf } = parseBody(event);
  const result = await authenticateCpf(cpf, {
    findClienteByCpf,
    signToken,
  });

  if (!result.ok) {
    return json(result.statusCode, { message: result.message });
  }

  return json(200, { token: result.token });
}
