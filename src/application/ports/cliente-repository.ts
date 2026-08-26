import type { Cliente } from '../../domain/auth';

export interface ClienteRepository {
  findByCpf(cpf: string): Promise<Cliente | null>;
}
