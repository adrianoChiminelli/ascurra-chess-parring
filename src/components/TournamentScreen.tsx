import { useEffect, useMemo, useRef, useState, type Dispatch } from 'react';
import { Check, Download, ListOrdered, Plus, Swords, Wrench } from 'lucide-react';
import type { TournamentState } from '../types';
import {
  canEditRound,
  canGenerateNextRound,
  computeStandings,
  isRoundComplete,
} from '../lib/tournament.ts';
import type { TournamentAction } from '../lib/tournamentReducer.ts';
import { downloadTextFile } from '../lib/download.ts';
import { exportFileName, serializeTournament } from '../lib/tournamentFile.ts';
import { MaintenancePanel } from './MaintenancePanel';
import { StandingsPanel } from './StandingsPanel';
import { RoundPanel } from './RoundPanel';
import './styles/TournamentScreen.css';
import knightImage from '../assets/knight.png';

interface TournamentScreenProps {
  state: TournamentState;
  dispatch: Dispatch<TournamentAction>;
}

type TabKey = 'standings' | 'maintenance' | `round-${number}`;

export function TournamentScreen({ state, dispatch }: TournamentScreenProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(
    state.rounds.length > 0 ? `round-${state.rounds.length}` : 'standings',
  );
  const railRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Cada aba abre do topo, e o item ativo da barra fica visível mesmo com muitas rodadas.
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    railRef.current?.querySelector('.tab-rail-item.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeTab]);

  const participantsById = useMemo(
    () => new Map(state.participants.map((p) => [p.id, p])),
    [state.participants],
  );

  const standings = useMemo(() => computeStandings(state), [state]);
  const pointsById = useMemo(
    () => new Map(standings.map((row) => [row.participant.id, row.points])),
    [standings],
  );

  function handleGenerateNext() {
    dispatch({ type: 'generateNextRound' });
    setActiveTab(`round-${state.rounds.length + 1}`);
  }

  function handleExport() {
    downloadTextFile(exportFileName(state), serializeTournament(state));
  }

  const canGenerateNext = canGenerateNextRound(state);
  const roundsPlayed = state.rounds.filter(isRoundComplete).length;

  return (
    <>
      <header className="app-header">
        <div>
          <img src={knightImage} className="logo-image" alt="Clube de Xadrez Ascurra" />
        </div>
        <div className="app-title">
          <small>Ascurra Chess</small>
          {state.config.name}
        </div>
        <div className="tournament-header">
          <div className="tournament-header-actions">
            <div className="tournament-header-meta">
              <span>
                Rodada <strong>{state.rounds.length}</strong> de{' '}
                <strong>{state.config.totalRounds}</strong>
              </span>
              <span className="round-progress" aria-hidden>
                {Array.from({ length: state.config.totalRounds }, (_, index) => {
                  const round = state.rounds[index];
                  const status = !round ? '' : isRoundComplete(round) ? 'done' : 'current';
                  return <span key={index} className={`round-progress-pip ${status}`} />;
                })}
              </span>
            </div>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                if (window.confirm('Iniciar um novo torneio? O torneio atual será perdido.')) {
                  dispatch({ type: 'reset' });
                }
              }}
            >
              <Plus size={15} />
              Novo torneio
            </button>
          </div>
        </div>
      </header>

      <div className="tournament-body">
        <nav className="tab-rail" ref={railRef}>
          <div className="tab-rail-standings">
            <button
              type="button"
              className={`tab-rail-item ${activeTab === 'standings' ? 'active' : ''}`}
              onClick={() => setActiveTab('standings')}
            >
              <ListOrdered size={16} />
              Placar
            </button>
          </div>

          <span className="tab-rail-label">Rodadas</span>
          <div className="tab-rail-rounds">
            {state.rounds.map((round) => (
              <button
                key={round.number}
                type="button"
                className={`tab-rail-item ${
                  activeTab === `round-${round.number}` ? 'active' : ''
                }`}
                onClick={() => setActiveTab(`round-${round.number}`)}
              >
                <Swords size={16} />
                Rodada {round.number}
                {isRoundComplete(round) && (
                  <span className="tab-rail-round-badge" aria-label="Concluída">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="tab-rail-footer">
            <button type="button" className="tab-rail-item" onClick={handleExport} aria-label="Exportar torneio" title="Exportar torneio">
              <Download size={16} />
              <span className="tab-rail-item-label">Exportar</span>
            </button>
            <button
              type="button"
              className={`tab-rail-item ${activeTab === 'maintenance' ? 'active' : ''}`}
              onClick={() => setActiveTab('maintenance')}
              aria-label="Manutenção"
              title="Manutenção"
            >
              <Wrench size={16} />
              <span className="tab-rail-item-label">Manutenção</span>
            </button>
          </div>
        </nav>

        <div className="tab-content" ref={contentRef}>
          {activeTab === 'standings' ? (
            <StandingsPanel
              standings={standings}
              roundsPlayed={roundsPlayed}
              tiebreakOrder={state.config.tiebreakOrder}
            />
          ) : activeTab === 'maintenance' ? (
            <MaintenancePanel
              state={state}
              pointsById={pointsById}
              onRename={(participantId, name) => dispatch({ type: 'renameParticipant', participantId, name })}
              onWithdraw={(participantId) => dispatch({ type: 'withdrawParticipant', participantId })}
            />
          ) : (
            (() => {
              const roundNumber = Number(activeTab.replace('round-', ''));
              const round = state.rounds.find((r) => r.number === roundNumber);
              if (!round) return null;
              const isCurrentRound = canEditRound(state, roundNumber);
              return (
                <RoundPanel
                  round={round}
                  totalRounds={state.config.totalRounds}
                  participantsById={participantsById}
                  pointsById={pointsById}
                  onSetResult={(matchId, result) =>
                    dispatch({ type: 'setResult', roundNumber, matchId, result })
                  }
                  isCurrentRound={isCurrentRound}
                  canGenerateNext={isCurrentRound && canGenerateNext}
                  onGenerateNext={handleGenerateNext}
                />
              );
            })()
          )}
        </div>
      </div>
    </>
  );
}
