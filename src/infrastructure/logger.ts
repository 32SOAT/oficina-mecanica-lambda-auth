type LogLevel = 'info' | 'warn' | 'error';

export function logStructured(
  event: string,
  fields: Record<string, unknown>,
  level: LogLevel = 'info',
): void {
  const line = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  });

  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}
