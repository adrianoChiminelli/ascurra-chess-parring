/** Gera um id único (UUID v4). Requer contexto seguro (https ou localhost). */
export function createId(): string {
  return crypto.randomUUID();
}
