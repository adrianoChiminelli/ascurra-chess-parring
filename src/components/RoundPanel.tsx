import { ArrowRight, Coffee, ChessKing } from 'lucide-react';
import type { Match, Participant, Round } from '../types';

interface RoundPanelProps {
  round: Round;
  totalRounds: number;
  participantsById: Map<string, Participant>;
  onSetResult: (matchId: string, result: Match['result']) => void;
  isCurrentRound: boolean;
  canGenerateNext: boolean;
  onGenerateNext: () => void;
}

function nameOf(participantsById: Map<string, Participant>, id: string) {
  return participantsById.get(id)?.name ?? id;
}

export function RoundPanel({
  round,
  totalRounds,
  participantsById,
  onSetResult,
  isCurrentRound,
  canGenerateNext,
  onGenerateNext,
}: RoundPanelProps) {
  const isFinalRound = round.number >= totalRounds;

  return (
    <div>
      <div className="panel-heading">
        <div>
          <h2 className="panel-title">Rodada {round.number}</h2>
          <p className="panel-subtitle">
            {round.matches.length} partida{round.matches.length === 1 ? '' : 's'}
            {round.byes.length > 0 &&
              ` · ${round.byes.length} bye${round.byes.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      <div className="match-list">
        {round.byes.map((bye) => (
          <div className="match-card" key={bye.id}>
            <span className="match-board-no">Bye</span>
            <div className="match-players">
              <span className="match-player">
                {nameOf(participantsById, bye.player)}
              </span>
            </div>
            <span className="match-bye-tag">
              <Coffee size={13} />
              Folga · 1 ponto
            </span>
          </div>
        ))}

        {round.matches.map((match, index) => {
          const whiteWon = match.result === 1;
          const blackWon = match.result === 0;
          const draw = match.result === 0.5;

          return (
            <div className="match-card" key={match.id}>
              <span className="match-board-no">Mesa {index + 1}</span>
              <div className="match-players">
                <span
                  className={`match-player ${
                    whiteWon ? 'decided-win' : blackWon ? 'decided-loss' : ''
                  }`}
                >
                  <ChessKing
                    size={18}
                    className="player-side-icon white"
                    aria-hidden
                    style={{ marginRight: 8 }}
                  />
                  {nameOf(participantsById, match.white)}
                </span>
                <span className="match-vs">vs</span>
                <span
                  className={`match-player ${
                    blackWon ? 'decided-win' : whiteWon ? 'decided-loss' : ''
                  }`}
                >
                  {nameOf(participantsById, match.black)}
                  <ChessKing
                    size={18}
                    className="player-side-icon black"
                    aria-hidden
                    style={{ marginLeft: 8 }}
                  />
                </span>
              </div>
              <div className="result-btns">
                <button
                  type="button"
                  className={`result-btn ${whiteWon ? 'selected-win' : ''}`}
                  onClick={() => onSetResult(match.id, 1)}
                >
                  1-0
                </button>
                <button
                  type="button"
                  className={`result-btn ${draw ? 'selected-draw' : ''}`}
                  onClick={() => onSetResult(match.id, 0.5)}
                >
                  0.5-0.5
                </button>
                <button
                  type="button"
                  className={`result-btn ${blackWon ? 'selected-win' : ''}`}
                  onClick={() => onSetResult(match.id, 0)}
                >
                  0-1
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isCurrentRound && (
        <div className="round-footer">
          {isFinalRound ? (
            <span className="round-footer-hint">
              Esta é a última rodada do torneio.
            </span>
          ) : (
            <>
              <button
                type="button"
                className="primary-btn"
                disabled={!canGenerateNext}
                onClick={onGenerateNext}
              >
                Gerar rodada {round.number + 1}
                <ArrowRight size={16} />
              </button>
              {!canGenerateNext && (
                <span className="round-footer-hint">
                  Marque o resultado de todas as partidas para liberar a próxima rodada.
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
