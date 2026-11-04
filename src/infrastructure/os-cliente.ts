import type { ClienteRepository } from '../application/ports/cliente-repository';
import type { Cliente } from '../domain/auth';

type ClienteAuth = {
  id?: string;
  documento?: string;
  deletedAt?: string | null;
};

function osBaseUrl(): string {
  return (process.env.OS_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
}

function sagaToken(): string {
  return process.env.SAGA_TOKEN ?? 'oficina-local';
}

function readCliente(payload: unknown): Cliente {
  const envelope = payload as { data?: ClienteAuth };
  const body = envelope.data ?? (payload as ClienteAuth);
  if (!body.id || !body.documento) {
    throw new Error('Resposta da OS sem id ou documento do cliente');
  }
  return {
    id: body.id,
    documento: body.documento,
    deletedAt: body.deletedAt ? new Date(body.deletedAt) : null,
  };
}

async function findByCpf(cpf: string): Promise<Cliente | null> {
  const url = `${osBaseUrl()}/api/v1/clientes/consulta-auth`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-saga-token': sagaToken(),
      },
      body: JSON.stringify({ documento: cpf }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'falha de rede';
    throw new Error(`OS indisponível em ${url}: ${message}`);
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`OS respondeu ${response.status} em ${url}`);
  }

  return readCliente(JSON.parse(await response.text()) as unknown);
}

export const osClienteRepository: ClienteRepository = {
  findByCpf,
};
