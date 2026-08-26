export type AuthRole = 'cliente';

export type Cliente = {
  id: string;
  documento: string;
  deletedAt: Date | null;
};

export type AuthTokenPayload = {
  sub: string;
  cpf: string;
  role: AuthRole;
};
