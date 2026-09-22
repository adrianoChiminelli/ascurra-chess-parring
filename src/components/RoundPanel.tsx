import { ArrowRight, Coffee } from 'lucide-react';
import { GiChessKing } from 'react-icons/gi';
import type { Match, Participant, Round } from '../types';

interface RoundPanelProps {
  round: Round;
  totalRounds: number;
  participantsById: Map<string, Participant>;
  pointsById: Map<string, number>;
  onSetResult: (matchId: string, result: Match['result']) => void;
  isCurrentRound: boolean;
  canGenerateNext: boolean;
  onGenerateNext: () => void;
}

function nameOf(participantsById: Map<string, Participant>, id: string) {
  return participantsById.get(id)?.name ?? id;
}

function formatPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1).replace(/\.0$/, '');
}

export function RoundPanel({
  round,
  totalRounds,
  participantsById,
  pointsById,
  onSetResult,
  isCurrentRound,
  canGenerateNext,
  onGenerateNext,
}: RoundPanelProps) {
  const isFinalRound = round.number >= totalRounds;
  const isInvalidRound = round.isInvalid;

  const roundFooter = () => {
    if (isFinalRound) {
      return (
        <span className="round-footer-hint">
          Esta é a última rodada do torneio.
        </span>
      );
    }

    if (isInvalidRound) {
      return (
        <span className="round-footer-hint">
          Não há mais partidas válidas para este torneio. Consulte o placar para o resultado.
        </span>
      );
    }

    return (
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
    );
  }

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
          const whitePoints = pointsById.get(match.white) ?? 0;
          const blackPoints = pointsById.get(match.black) ?? 0;

          return (
            <div className="match-card" key={match.id}>
              <span className="match-board-no">Mesa {index + 1}</span>
              <div className="match-players">
                <span
                  className={`match-player ${
                    whiteWon ? 'decided-win' : blackWon ? 'decided-loss' : ''
                  }`}
                >
                  <span className="match-player-main">
                    <GiChessKing
                      size={23}
                      className="player-side-icon white"
                      aria-hidden
                    />
                    <span>{nameOf(participantsById, match.white)}</span>
                  </span>
                  <span className="match-player-points">
                    {formatPoints(whitePoints)}
                  </span>
                </span>
                <span className="match-vs">vs</span>
                <span
                  className={`match-player ${
                    blackWon ? 'decided-win' : whiteWon ? 'decided-loss' : ''
                  }`}
                >
                  <span className="match-player-points">
                    {formatPoints(blackPoints)}
                  </span>
                  <span className="match-player-main">
                    <span>{nameOf(participantsById, match.black)}</span>
                    <GiChessKing
                      size={23}
                      className="player-side-icon black"
                      aria-hidden
                    />
                  </span>
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
          {roundFooter()}
        </div>
      )}
    </div>
  );
}
