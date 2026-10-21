import { useRef, useState, type ChangeEvent } from 'react';
import {
  FileUp,
  Minus,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Play
} from 'lucide-react';
import {
  DEFAULT_TIEBREAK_ORDER,
  type ParticipantDraft,
  type TiebreakKind,
  type TournamentConfig,
  type TournamentState,
} from '../types';
import { createId } from '../lib/ids';
import { MAX_NAME_LENGTH, parseBatchText } from '../lib/participants';
import { FILE_ERROR_MESSAGES, MAX_FILE_SIZE, parseTournamentFile } from '../lib/tournamentFile';
import { TiebreakPicker } from './TiebreakPicker';
import './styles/HomeScreen.css';
import knightImage from '../assets/knight.png';

interface HomeScreenProps {
  onStart: (config: TournamentConfig, participants: ParticipantDraft[]) => void;
  onImport: (state: TournamentState) => void;
}

type EntryMode = 'individual' | 'batch';

export function HomeScreen({ onStart, onImport }: HomeScreenProps) {
  const [tournamentName, setTournamentName] = useState('');
  const [totalRounds, setTotalRounds] = useState(5);
  const [tiebreakOrder, setTiebreakOrder] = useState<TiebreakKind[]>(DEFAULT_TIEBREAK_ORDER);
  const [entryMode, setEntryMode] = useState<EntryMode>('individual');
  const [participants, setParticipants] = useState<ParticipantDraft[]>([]);

  const [singleName, setSingleName] = useState('');
  const [singleRating, setSingleRating] = useState('');
  const [batchText, setBatchText] = useState('');
  const [batchError, setBatchError] = useState('');
  const [error, setError] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Permite selecionar o mesmo arquivo de novo depois de um erro.
    event.target.value = '';
    if (!file) return;

    const result = file.size > MAX_FILE_SIZE ? ({ ok: false, error: 'too-large' } as const) : parseTournamentFile(await file.text());
    if (result.ok) onImport(result.state);
    else setImportError(FILE_ERROR_MESSAGES[result.error]);
  }

  function addSingleParticipant() {
    const name = singleName.trim();
    if (!name) return;
    const rating = singleRating.trim() ? Number(singleRating) : null;
    setParticipants((prev) => [...prev, { id: createId(), name, rating }]);
    setSingleName('');
    setSingleRating('');
  }

  function addBatchParticipants() {
    const { entries, rejected } = parseBatchText(batchText);
    if (entries.length > 0) {
      setParticipants((prev) => [...prev, ...entries.map((entry) => ({ id: createId(), ...entry }))]);
    }
    // Linhas rejeitadas ficam no campo para o usuário corrigir.
    setBatchText(rejected.join('\n'));
    setBatchError(
      rejected.length > 0
        ? `${rejected.length} linha${rejected.length === 1 ? '' : 's'} não adicionada${rejected.length === 1 ? '' : 's'}: o nome deve ter até ${MAX_NAME_LENGTH} caracteres.`
        : '',
    );
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
          <img src={knightImage} className="logo-image" alt="Clube de Xadrez Ascurra" />
        </div>
        <div className="app-title">
          <small>Clube de Xadrez Ascurra</small>
          Ascurra Chess
        </div>
        <div className="home-header-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            data-testid="import-file-input"
            onChange={handleImportFile}
          />
          <button type="button" className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={15} />
            Importar torneio
          </button>
        </div>
      </header>
      {importError && (
        <div className="import-error" role="alert">
          <span>{importError}</span>
          <button type="button" className="import-error-close" aria-label="Fechar aviso" onClick={() => setImportError('')}>
            ×
          </button>
        </div>
      )}

      <main className="home-main">
        <div className="home-layout">
          <div className="home-form">
            <span className="home-kicker">Novo torneio · Sistema suíço</span>
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
                    maxLength={MAX_NAME_LENGTH}
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
                    Um nome por linha, com até {MAX_NAME_LENGTH} caracteres. O rating é opcional — adicione ", 1800" após o nome se quiser informá-lo.
                  </p>
                  {batchError && <p className="form-error">{batchError}</p>}
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
                  {participants.map((p, index) => (
                    <li key={p.id}>
                      <span>
                        <span className="participant-name">
                          {index + 1}. {p.name}
                        </span>{' '}
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
