export const MAX_NAME_LENGTH = 20;

export interface ParticipantEntry {
  name: string;
  rating: number | null;
}

export interface BatchParseResult {
  entries: ParticipantEntry[];
  /** Linhas não aceitas (nome acima do limite), preservadas como foram digitadas. */
  rejected: string[];
}

/** Aceita "Nome, 1800", "Nome; 1800" ou apenas "Nome". */
function parseLine(line: string): ParticipantEntry {
  const match = line.match(/^(.*?)[,;]\s*(\d{2,4})\s*$/);
  if (match) return { name: match[1].trim(), rating: Number(match[2]) };
  return { name: line, rating: null };
}

export function parseBatchText(text: string): BatchParseResult {
  const result: BatchParseResult = { entries: [], rejected: [] };

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const entry = parseLine(line);
    if (entry.name && entry.name.length <= MAX_NAME_LENGTH) result.entries.push(entry);
    else result.rejected.push(line);
  }

  return result;
}
