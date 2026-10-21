import type { Participant } from '../types';
import { formatPoints } from '../lib/format';

interface MaintenancePanelProps {
  participants: Participant[];
  pointsById: Map<string, number>;
}

export function MaintenancePanel({ participants, pointsById }: MaintenancePanelProps) {
  const sorted = [...participants].sort((a, b) => a.startingRank - b.startingRank);
  const activeCount = participants.filter((p) => p.withdrawnInRound === null).length;

  return (
    <div>
      <div className="panel-heading">
        <div>
          <h2 className="panel-title">Manutenção</h2>
          <p className="panel-subtitle">
            {activeCount} de {participants.length} participante{participants.length === 1 ? '' : 's'} ativo
            {activeCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="standings-table-wrap">
        <table className="standings-table maintenance-table">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Participante</th>
              <th className="col-rating">Rating</th>
              <th>Pts</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((participant) => (
              <tr key={participant.id} className={participant.withdrawnInRound !== null ? 'is-withdrawn' : undefined}>
                <td className="standings-rank">
                  <span className="standings-rank-chip">{participant.startingRank}</span>
                </td>
                <td className="maintenance-name">{participant.name}</td>
                <td className="standings-record col-rating">{participant.rating ?? '—'}</td>
                <td className="standings-points">{formatPoints(pointsById.get(participant.id) ?? 0)}</td>
                <td>
                  {participant.withdrawnInRound === null ? (
                    <span className="status-tag is-active">Ativo</span>
                  ) : (
                    <span className="status-tag is-withdrawn">Retirado na R{participant.withdrawnInRound}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
