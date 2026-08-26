import { isValidCpf, normalizeCpf } from './cpf';

describe('cpf', () => {
  it('normaliza pontuação', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
  });

  it('aceita CPF válido', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('rejeita dígitos repetidos', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });

  it('rejeita tamanho errado', () => {
    expect(isValidCpf('123')).toBe(false);
  });

  it('rejeita CPF com dígitos verificadores errados', () => {
    expect(isValidCpf('529.982.247-26')).toBe(false);
  });

  it('aceita outro CPF válido', () => {
    expect(isValidCpf('111.444.777-35')).toBe(true);
  });
});
