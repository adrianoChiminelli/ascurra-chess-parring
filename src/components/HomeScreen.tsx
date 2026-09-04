import { useState } from 'react';
import {
  Minus,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Play
} from 'lucide-react';
import { DEFAULT_TIEBREAK_ORDER, type Participant, type TiebreakKind, type TournamentConfig } from '../types';
import { TiebreakPicker } from './TiebreakPicker';
import './styles/HomeScreen.css';
import knightImage from '../assets/knight.png';

interface HomeScreenProps {
  onStart: (config: TournamentConfig, participants: Participant[]) => void;
}

type EntryMode = 'individual' | 'batch';

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `p${Date.now().toString(36)}${idCounter}`;
}

function parseBatchLine(line: string): { name: string; rating: number | null } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  // Aceita "Nome, 1800" ou "Nome; 1800" ou apenas "Nome"
  const match = trimmed.match(/^(.*?)[,;]\s*(\d{2,4})\s*$/);
  const subStringFunction = (str: string) => str.trim().substring(0, 20);
  if (match) {
    return { name: subStringFunction(match[1]), rating: Number(match[2].substring(0, 4)) };
  }
  return { name: subStringFunction(trimmed), rating: null };
}

export function HomeScreen({ onStart }: HomeScreenProps) {
  const [tournamentName, setTournamentName] = useState('');
  const [totalRounds, setTotalRounds] = useState(5);
  const [tiebreakOrder, setTiebreakOrder] = useState<TiebreakKind[]>(DEFAULT_TIEBREAK_ORDER);
  const [entryMode, setEntryMode] = useState<EntryMode>('individual');
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [singleName, setSingleName] = useState('');
  const [singleRating, setSingleRating] = useState('');
  const [batchText, setBatchText] = useState('');
  const [error, setError] = useState('');

  function addSingleParticipant() {
    const name = singleName.trim();
    if (!name) return;
    const rating = singleRating.trim() ? Number(singleRating) : null;
    setParticipants((prev) => [...prev, { id: nextId(), name, rating }]);
    setSingleName('');
    setSingleRating('');
  }

  function addBatchParticipants() {
    const lines = batchText.split('\n').map(parseBatchLine).filter(Boolean) as {
      name: string;
      rating: number | null;
    }[];
    if (lines.length === 0) return;
    setParticipants((prev) => [
      ...prev,
      ...lines.map((l) => ({ id: nextId(), name: l.name, rating: l.rating })),
    ]);
    setBatchText('');
  }

  function removeParticipant(id: string) {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }

  function handleStart() {
    if (participants.length < 2) {
      setError('Adicione pelo menos 2 participantes para iniciar o torneio.');
      return;
    }
    setError('');
    onStart(
      {
        name: tournamentName.trim() || 'Torneio suíço',
        totalRounds,
        tiebreakOrder,
      },
      participants,
    );
  }

  return (
    <>
      <header className="app-header">
        <div>
          <img src={knightImage} className="logo-image" />
        </div>
        <div className="app-title">
          Ascurra Chess
        </div>
      </header>

      <main className="home-main">
        <div className="home-layout">
          <div className="home-form">
            <h1 className="home-eyebrow">Configure seu torneio</h1>
            <p className="home-sub">
              Defina o nome, o número de rodadas e a lista de participantes.
            </p>

            <div className="home-config-row">
              <div className="field-group grow">
                <label className="field-label" htmlFor="tournament-name">
                  Nome do torneio
                </label>
                <input
                  id="tournament-name"
                  className="text-input"
                  placeholder="Ex.: Aberto de Verão do Clube"
                  value={tournamentName}
                  maxLength={50}
                  onChange={(e) => setTournamentName(e.target.value)}
                />
              </div>

              <div className="field-group">
                <span className="field-label">Rodadas</span>
                <div className="rounds-stepper">
                  <button
                    type="button"
                    onClick={() => setTotalRounds((r) => Math.max(1, r - 1))}
                    aria-label="Diminuir rodadas"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="rounds-value">{totalRounds}</span>
                  <button
                    type="button"
                    onClick={() => setTotalRounds((r) => Math.min(30, r + 1))}
                    aria-label="Aumentar rodadas"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>

            <div className="field-group">
              <span className="field-label">Adicionar participantes</span>

              <div className="entry-mode-tabs">
                <button
                  type="button"
                  className={`entry-mode-tab ${entryMode === 'individual' ? 'active' : ''}`}
                  onClick={() => setEntryMode('individual')}
                >
                  <UserPlus size={15} />
                  Um por vez
                </button>
                <button
                  type="button"
                  className={`entry-mode-tab ${entryMode === 'batch' ? 'active' : ''}`}
                  onClick={() => setEntryMode('batch')}
                >
                  <Users size={15} />
                  Em lote
                </button>
              </div>

              {entryMode === 'individual' ? (
                <div className="individual-entry-row">
                  <input
                    className="text-input"
                    placeholder="Nome do participante"
                    maxLength={20}
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addSingleParticipant();
                    }}
                  />
                  <input
                    className="number-input"
                    placeholder="Rating (opcional)"
                    inputMode="numeric"
                    maxLength={4}
                    value={singleRating}
                    onChange={(e) =>
                      setSingleRating(e.target.value.replace(/\D/g, ''))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addSingleParticipant();
                    }}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={addSingleParticipant}
                    aria-label="Adicionar participante"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <textarea
                    className="textarea-input"
                    rows={5}
                    placeholder={'Um participante por linha, ex.:\nAna Souza, 1840\nBruno Lima\nCarla Nunes, 1620'}
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                  />
                  <p className="field-hint">
                    Um nome por linha. O rating é opcional — adicione ", 1800" após o nome se quiser informá-lo.
                  </p>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={addBatchParticipants}
                  >
                    <Plus size={15} />
                    Adicionar lista
                  </button>
                </div>
              )}
            </div>
            <TiebreakPicker value={tiebreakOrder} onChange={setTiebreakOrder} />
          </div>

          <aside className="home-sidebar">
            <div className="home-sidebar-heading">
              <h2>Participantes</h2>
              {participants.length > 0 && (
                <span className="participant-count">
                  {participants.length}
                </span>
              )}
            </div>

            <div className="home-sidebar-list-scroll">
              {participants.length === 0 ? (
                <p className="home-sidebar-empty">
                  Nenhum participante ainda. Use o formulário ao lado para
                  adicionar, um por um ou em lote.
                </p>
              ) : (
                <ul className="participant-list">
                  {participants.map((p) => (
                    <li key={p.id}>
                      <span>
                        <span className="participant-name">{p.name}</span>{' '}
                        {p.rating !== null && (
                          <span className="participant-rating">
                            {p.rating}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        className="participant-remove"
                        onClick={() => removeParticipant(p.id)}
                        aria-label={`Remover ${p.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="home-sidebar-footer">
              {error && <p className="form-error">{error}</p>}
              <button
                type="button"
                className="primary-btn"
                onClick={handleStart}
              >
                <Play size={16} />
                Iniciar torneio
              </button>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
