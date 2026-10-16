let counter = 0;

/** Gera um id único na sessão; o timestamp evita colisão com ids de sessões anteriores já persistidas. */
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter}`;
}
