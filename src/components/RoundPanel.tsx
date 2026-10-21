import { ArrowRight, Coffee, Shuffle } from 'lucide-react';
import { GiChessKing } from 'react-icons/gi';
import type { Match, Participant, Round } from '../types';
import { formatPoints } from '../lib/format';

interface RoundPanelProps {
  round: Round;
  totalRounds: number;
  participantsById: Map<string, Participant>;
  pointsById: Map<string, number>;
  onSetResult: (matchId: string, result: Match['result']) => void;
  isCurrentRound: boolean;
  canGenerateNext: boolean;
  onGenerateNext: () => void;
  canRepair: boolean;
  onRepair: () => void;
}

function nameOf(participantsById: Map<string, Participant>, id: string) {
  return participantsById.get(id)?.name ?? id;
}

function repairConfirmation(round: Round): string | null {
  const decided = round.matches.filter((m) => m.result !== null).length;
  if (decided === 0) return null;
  const draw = round.number === 1 ? ' e fazer um novo sorteio da ordem inicial' : '';
  return `Reemparceirar a rodada ${round.number}${draw}?\n\n${decided} resultado${decided === 1 ? '' : 's'} desta rodada ser${decided === 1 ? 'á descartado' : 'ão descartados'}.`;
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
  canRepair,
  onRepair,
}: RoundPanelProps) {
  function handleRepair() {
    const confirmation = repairConfirmation(round);
    if (confirmation === null || window.confirm(confirmation)) onRepair();
  }

  const isFinalRound = round.number >= totalRounds;
  const isReadOnly = !isCurrentRound;
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
            {isReadOnly && ' · somente leitura'}
          </p>
        </div>
        {isCurrentRound && (
          <button
            type="button"
            className="secondary-btn"
            disabled={!canRepair}
            onClick={handleRepair}
            title={
              canRepair
                ? round.number === 1
                  ? 'Novo sorteio da ordem inicial e novo pareamento'
                  : 'Desfaz esta rodada e emparceira novamente'
                : 'Nada mudou desde o pareamento: refazer geraria os mesmos pares'
            }
          >
            <Shuffle size={15} />
            Reemparceirar
          </button>
        )}
      </div>

      <div className="match-list">
        {round.byes.map((bye) => (
          <div className="match-card" key={bye.id}>
            <span className="match-board-no is-bye">
              <small>Bye</small>
            </span>
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
            <div className={`match-card ${match.result !== null ? 'is-decided' : ''}`} key={match.id}>
              <span className="match-board-no">
                <small>Mesa</small>
                {index + 1}
              </span>
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
              {match.forfeit !== undefined && (
                <span className="match-forfeit-tag" title={`${nameOf(participantsById, match.forfeit === 'white' ? match.white : match.black)} não compareceu`}>
                  W.O.
                </span>
              )}
              <div className="result-btns">
                <button
                  type="button"
                  disabled={isReadOnly || match.forfeit !== undefined}
                  className={`result-btn ${whiteWon ? 'selected-win' : ''}`}
                  onClick={() => onSetResult(match.id, 1)}
                >
                  1-0
                </button>
                <button
                  type="button"
                  disabled={isReadOnly || match.forfeit !== undefined}
                  className={`result-btn ${draw ? 'selected-draw' : ''}`}
                  onClick={() => onSetResult(match.id, 0.5)}
                >
                  0.5-0.5
                </button>
                <button
                  type="button"
                  disabled={isReadOnly || match.forfeit !== undefined}
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
