import { Pool } from 'pg';
import type { ClienteRecord } from '../domain/auth';

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT ?? '5432'),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      ssl:
        process.env.POSTGRES_SSL === '1'
          ? { rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== '0' }
          : undefined,
      max: 2,
    });
  }

  return pool;
}

export async function findClienteByCpf(cpf: string): Promise<ClienteRecord | null> {
  const result = await getPool().query<{
    id: string;
    documento: string;
    deleted_at: Date | null;
  }>(
    `SELECT id, documento, deleted_at
     FROM cliente
     WHERE documento = $1
     LIMIT 1`,
    [cpf],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    documento: row.documento,
    deletedAt: row.deleted_at,
  };
}

export async function resetPoolForTests(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
