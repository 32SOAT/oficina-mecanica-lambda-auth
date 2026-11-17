export class OsAuthError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`OS respondeu ${status} em ${url}`);
    this.name = 'OsAuthError';
  }
}

export interface OsAuthClient {
  login(cpf: string): Promise<string>;
}
