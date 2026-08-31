import { useMemo, useState } from 'react';
import { Crown, ListOrdered, Plus, Swords } from 'lucide-react';
import type { Match, TournamentState } from '../types';
import {
  canGenerateNextRound,
  computeStandings,
  generateNextRound,
  isRoundComplete,
} from '../lib/tournament';
import { StandingsPanel } from './StandingsPanel';
import { RoundPanel } from './RoundPanel';

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
        <div className="app-logo">
          <Crown size={18} />
        </div>
        <div className="app-title">{state.config.name}</div>
        <div className="tournament-header">
          <span />
          <div className="tournament-header-actions">
            <div className="tournament-header-meta">
              Rodada <strong>{state.rounds.length}</strong> de{' '}
              <strong>{state.config.totalRounds}</strong>
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
                <span className="tab-rail-round-badge">✓</span>
              )}
            </button>
          ))}
        </nav>

        <div className="tab-content">
          {activeTab === 'standings' ? (
            <StandingsPanel standings={standings} roundsPlayed={roundsPlayed} />
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
