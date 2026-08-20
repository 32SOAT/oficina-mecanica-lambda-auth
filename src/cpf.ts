const NON_DIGIT = /\D/g;

export function normalizeCpf(raw: string): string {
  return String(raw).replace(NON_DIGIT, '');
}

function hasRepeatedDigits(digits: string): boolean {
  return /^([0-9])\1+$/.test(digits);
}

function verifierSum(digits: string, factor: number): number {
  return digits
    .split('')
    .map(Number)
    .reduce((sum, digit) => sum + digit * factor--, 0);
}

function verifierDigit(sum: number): number {
  return sum % 11 < 2 ? 0 : 11 - (sum % 11);
}

export function isValidCpf(raw: string): boolean {
  const normalized = normalizeCpf(raw);
  if (normalized.length !== 11 || hasRepeatedDigits(normalized)) {
    return false;
  }

  const base = normalized.slice(0, 9);
  const digits = normalized.slice(9);
  const first = verifierDigit(verifierSum(base, 10));
  const second = verifierDigit(verifierSum(base + String(first), 11));

  return digits === `${first}${second}`;
}
