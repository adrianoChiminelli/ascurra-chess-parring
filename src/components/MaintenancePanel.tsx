import { useState } from 'react';
import { Check, Pencil, UserMinus, X } from 'lucide-react';
import type { Participant, TournamentState } from '../types';
import { formatPoints } from '../lib/format';
import { MAX_NAME_LENGTH } from '../lib/participants';
import { normalizeParticipantName, pendingMatchOf } from '../lib/tournament.ts';

interface MaintenancePanelProps {
  state: TournamentState;
  pointsById: Map<string, number>;
  onRename: (participantId: string, name: string) => void;
  onWithdraw: (participantId: string) => void;
}

function withdrawConfirmation(state: TournamentState, participant: Participant): string {
  const lines = [`Remover ${participant.name} do torneio?`, ''];
  const pending = pendingMatchOf(state, participant.id);
  if (pending) {
    const opponentId = pending.white === participant.id ? pending.black : pending.white;
    const opponent = state.participants.find((p) => p.id === opponentId)?.name ?? opponentId;
    lines.push(`A partida pendente na rodada ${state.rounds.length} será dada como vitória por W.O. para ${opponent}.`);
  }
  lines.push('O participante continua no placar com a pontuação atual e não será mais emparceirado.');
  lines.push('Esta ação não pode ser desfeita.');
  return lines.join('\n');
}

export function MaintenancePanel({ state, pointsById, onRename, onWithdraw }: MaintenancePanelProps) {
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const sorted = [...state.participants].sort((a, b) => a.startingRank - b.startingRank);
  const activeCount = state.participants.filter((p) => p.withdrawnInRound === null).length;
  const editingValid = editing !== null && normalizeParticipantName(editing.name) !== null;

  function saveEdit() {
    if (!editing || !editingValid) return;
    onRename(editing.id, editing.name);
    setEditing(null);
  }

  function withdraw(participant: Participant) {
    if (window.confirm(withdrawConfirmation(state, participant))) onWithdraw(participant.id);
  }

  return (
    <div>
      <div className="panel-heading">
        <div>
          <h2 className="panel-title">Manutenção</h2>
          <p className="panel-subtitle">
            {activeCount} de {state.participants.length} participante{state.participants.length === 1 ? '' : 's'} ativo
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
              <th>
                <span className="visually-hidden">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((participant) => {
              const isWithdrawn = participant.withdrawnInRound !== null;
              const isEditing = editing?.id === participant.id;

              return (
                <tr key={participant.id} className={isWithdrawn ? 'is-withdrawn' : undefined}>
                  <td className="standings-rank">
                    <span className="standings-rank-chip">{participant.startingRank}</span>
                  </td>
                  <td className="maintenance-name">
                    {isEditing ? (
                      <input
                        className="text-input maintenance-name-input"
                        aria-label={`Novo nome de ${participant.name}`}
                        aria-invalid={!editingValid}
                        value={editing.name}
                        maxLength={MAX_NAME_LENGTH}
                        autoFocus
                        onChange={(e) => setEditing({ id: participant.id, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') setEditing(null);
                        }}
                      />
                    ) : (
                      participant.name
                    )}
                  </td>
                  <td className="standings-record col-rating">{participant.rating ?? '—'}</td>
                  <td className="standings-points">{formatPoints(pointsById.get(participant.id) ?? 0)}</td>
                  <td>
                    {isWithdrawn ? (
                      <span className="status-tag is-withdrawn">Retirado na R{participant.withdrawnInRound}</span>
                    ) : (
                      <span className="status-tag is-active">Ativo</span>
                    )}
                  </td>
                  <td className="maintenance-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="maintenance-action"
                          aria-label="Salvar nome"
                          title="Salvar"
                          disabled={!editingValid}
                          onClick={saveEdit}
                        >
                          <Check size={15} />
                        </button>
                        <button
                          type="button"
                          className="maintenance-action"
                          aria-label="Cancelar edição"
                          title="Cancelar"
                          onClick={() => setEditing(null)}
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="maintenance-action"
                          aria-label={`Renomear ${participant.name}`}
                          title="Renomear"
                          onClick={() => setEditing({ id: participant.id, name: participant.name })}
                        >
                          <Pencil size={15} />
                        </button>
                        {!isWithdrawn && (
                          <button
                            type="button"
                            className="maintenance-action is-danger"
                            aria-label={`Remover ${participant.name} do torneio`}
                            title="Remover do torneio"
                            onClick={() => withdraw(participant)}
                          >
                            <UserMinus size={15} />
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
