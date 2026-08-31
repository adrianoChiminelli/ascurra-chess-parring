import { ListOrdered } from 'lucide-react';
import type { StandingRow } from '../types';

interface StandingsPanelProps {
  standings: StandingRow[];
  roundsPlayed: number;
}

export function StandingsPanel({ standings, roundsPlayed }: StandingsPanelProps) {
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
        <table className="standings-table">
          <thead>
            <tr>
              <th></th>
              <th>Participante</th>
              <th>Pts</th>
              <th>V-E-D</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => (
              <tr key={row.participant.id}>
                <td className="standings-rank">
                  {index === 0 && row.points > 0 ? (
                    <ListOrdered size={14} />
                  ) : (
                    index + 1
                  )}
                </td>
                <td>
                  <div className="standings-name">{row.participant.name}</div>
                  {row.participant.rating !== null && (
                    <div className="standings-rating">
                      {row.participant.rating}
                    </div>
                  )}
                </td>
                <td className="standings-points">{row.points}</td>
                <td className="standings-record">
                  {row.wins}-{row.draws}-{row.losses}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
