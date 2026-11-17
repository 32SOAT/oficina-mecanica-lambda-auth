import { OsAuthError, type OsAuthClient } from '../application/ports/os-auth';

function osBaseUrl(): string {
  return (process.env.OS_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
}

function readToken(payload: unknown): string {
  const envelope = payload as { data?: { token?: unknown }; token?: unknown };
  const token = envelope.data?.token ?? envelope.token;
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Resposta da OS sem token');
  }
  return token;
}

async function login(cpf: string): Promise<string> {
  const url = `${osBaseUrl()}/api/v1/auth/cpf`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cpf }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'falha de rede';
    throw new Error(`OS indisponível em ${url}: ${message}`);
  }

  if (response.status === 400 || response.status === 401) {
    throw new OsAuthError(response.status, url);
  }

  if (!response.ok) {
    throw new Error(`OS respondeu ${response.status} em ${url}`);
  }

  return readToken(JSON.parse(await response.text()) as unknown);
}

export const osAuthClient: OsAuthClient = { login };
