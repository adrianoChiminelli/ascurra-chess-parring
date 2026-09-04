import { Crown, HelpCircle } from 'lucide-react';
import { TIEBREAK_LABELS, type StandingRow, type TiebreakKind } from '../types';

interface StandingsPanelProps {
  standings: StandingRow[];
  roundsPlayed: number;
  tiebreakOrder: TiebreakKind[];
}

export function StandingsPanel({ standings, roundsPlayed, tiebreakOrder }: StandingsPanelProps) {
  const leaderParticipantId = standings[0]?.participant.id;

  return (
    <div>
      <div className="panel-heading">
        <div>
          <h2 className="panel-title">Placar</h2>
          <p className="panel-subtitle">
            {roundsPlayed === 0
              ? 'Nenhuma rodada disputada ainda'
              : `Após ${roundsPlayed} rodada${roundsPlayed === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      {standings.length === 0 ? (
        <p className="empty-state">Nenhum participante cadastrado.</p>
      ) : (
        <div className="standings-table-wrap">
          <table className="standings-table">
            <thead>
              <tr>
                <th></th>
                <th>Participante</th>
                <th>Pts</th>
                <th>V-E-D</th>
                {tiebreakOrder.map((kind) => (
                  <th key={kind}>
                    <span className="th-with-hint">
                      {TIEBREAK_LABELS[kind].short}
                      <span className="hint-icon" tabIndex={0} aria-label={TIEBREAK_LABELS[kind].description}>
                        <HelpCircle size={13} />
                        <span className="hint-tooltip">{TIEBREAK_LABELS[kind].description}</span>
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.map((row, index) => {
                const isLeader = row.participant.id === leaderParticipantId;

                return (
                  <tr key={row.participant.id}>
                    <td className="standings-rank">{index + 1}</td>
                    <td>
                      <div className="standings-name">
                        {row.participant.name}
                        {isLeader && (
                          <Crown size={13} className="standings-leader-icon" aria-label="Líder" />
                        )}
                      </div>
                      {row.participant.rating !== null && (
                        <div className="standings-rating">{row.participant.rating}</div>
                      )}
                    </td>
                    <td className="standings-points">{row.points}</td>
                    <td className="standings-record">
                      {row.wins}-{row.draws}-{row.losses}
                    </td>
                    {tiebreakOrder.map((kind) => (
                      <td key={`${row.participant.id}-${kind}`} className="standings-tiebreak">
                        {row.tiebreaks[kind] === undefined ? '—' : row.tiebreaks[kind]?.toFixed(1)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
