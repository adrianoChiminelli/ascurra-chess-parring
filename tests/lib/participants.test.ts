import { describe, expect, it } from 'vitest';
import { MAX_NAME_LENGTH, parseBatchText } from '../../src/lib/participants.ts';

describe('parseBatchText', () => {
  it('lê nome com rating separado por vírgula ou ponto e vírgula', () => {
    expect(parseBatchText('Ana Souza, 1840\nBruno; 1620').entries).toEqual([
      { name: 'Ana Souza', rating: 1840 },
      { name: 'Bruno', rating: 1620 },
    ]);
  });

  it('aceita nome sem rating e ignora linhas vazias', () => {
    expect(parseBatchText('  Carla  \n\n   \nDiego').entries).toEqual([
      { name: 'Carla', rating: null },
      { name: 'Diego', rating: null },
    ]);
  });

  it('aceita nome no limite de caracteres', () => {
    const name = 'a'.repeat(MAX_NAME_LENGTH);
    expect(parseBatchText(name)).toEqual({ entries: [{ name, rating: null }], rejected: [] });
  });

  it('rejeita nomes acima do limite sem truncar, preservando a linha', () => {
    const line = `${'a'.repeat(MAX_NAME_LENGTH + 1)}, 1500`;
    expect(parseBatchText(`Ana\n${line}`)).toEqual({
      entries: [{ name: 'Ana', rating: null }],
      rejected: [line],
    });
  });
});
