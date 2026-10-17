import { useMemo, useState } from 'react';
import { Check, ListOrdered, Plus, Swords } from 'lucide-react';
import type { Match, TournamentState } from '../types';
import {
  canGenerateNextRound,
  computeStandings,
  generateNextRound,
  isRoundComplete,
} from '../lib/tournament.ts';
import { StandingsPanel } from './StandingsPanel';
import { RoundPanel } from './RoundPanel';
import './styles/TournamentScreen.css';
import knightImage from '../assets/knight.png';

interface TournamentScreenProps {
  state: TournamentState;
  onChange: (state: TournamentState) => void;
  onNewTournament: () => void;
}

type TabKey = 'standings' | `round-${number}`;

export function TournamentScreen({
  state,
  onChange,
  onNewTournament,
}: TournamentScreenProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(
    state.rounds.length > 0 ? `round-${state.rounds.length}` : 'standings',
  );

  const participantsById = useMemo(
    () => new Map(state.participants.map((p) => [p.id, p])),
    [state.participants],
  );

  const standings = useMemo(() => computeStandings(state), [state]);
  const pointsById = useMemo(
    () => new Map(standings.map((row) => [row.participant.id, row.points])),
    [standings],
  );

  function setMatchResult(
    roundNumber: number,
    matchId: string,
    result: Match['result'],
  ) {
    const rounds = state.rounds.map((round) => {
      if (round.number !== roundNumber) return round;
      return {
        ...round,
        matches: round.matches.map((m) =>
          m.id === matchId ? { ...m, result } : m,
        ),
      };
    });
    onChange({ ...state, rounds });
  }

  function handleGenerateNext() {
    const newRound = generateNextRound(state.participants, state.rounds);
    const rounds = [...state.rounds, newRound];
    onChange({ ...state, rounds });
    setActiveTab(`round-${newRound.number}`);
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
                  onNewTournament();
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
        <nav className="tab-rail">
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
        </nav>

        <div className="tab-content">
          {activeTab === 'standings' ? (
            <StandingsPanel
              standings={standings}
              roundsPlayed={roundsPlayed}
              tiebreakOrder={state.config.tiebreakOrder}
            />
          ) : (
            (() => {
              const roundNumber = Number(activeTab.replace('round-', ''));
              const round = state.rounds.find((r) => r.number === roundNumber);
              if (!round) return null;
              const isCurrentRound =
                roundNumber === state.rounds[state.rounds.length - 1].number;
              return (
                <RoundPanel
                  round={round}
                  totalRounds={state.config.totalRounds}
                  participantsById={participantsById}
                  pointsById={pointsById}
                  onSetResult={(matchId, result) =>
                    setMatchResult(roundNumber, matchId, result)
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
