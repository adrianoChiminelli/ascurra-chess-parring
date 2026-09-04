import { ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { TIEBREAK_LABELS, type TiebreakKind } from '../types';

const ALL_TIEBREAKS: TiebreakKind[] = Object.keys(TIEBREAK_LABELS) as TiebreakKind[];

interface TiebreakPickerProps {
  value: TiebreakKind[];
  onChange: (nextValue: TiebreakKind[]) => void;
}

export function TiebreakPicker({ value, onChange }: TiebreakPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draggedKind, setDraggedKind] = useState<TiebreakKind | null>(null);

  const availableChoices = useMemo(
    () => ALL_TIEBREAKS.filter((kind) => !value.includes(kind)),
    [value],
  );

  function reorder(kind: TiebreakKind, targetIndex: number) {
    const fromIndex = value.indexOf(kind);
    if (fromIndex === -1 || fromIndex === targetIndex) return;

    const nextValue = [...value];
    const [moved] = nextValue.splice(fromIndex, 1);
    nextValue.splice(targetIndex, 0, moved);
    onChange(nextValue);
  }

  function handleDrop(targetKind: TiebreakKind) {
    if (!draggedKind || draggedKind === targetKind) return;
    const targetIndex = value.indexOf(targetKind);
    if (targetIndex === -1) return;
    reorder(draggedKind, targetIndex);
    setDraggedKind(null);
  }

  function summaryLabel() {
    if (value.length === 0) return 'Nenhum critério';
    if (value.length <= 3) return value.map((kind) => TIEBREAK_LABELS[kind].short).join(', ');
    return `${value.slice(0, 3).map((kind) => TIEBREAK_LABELS[kind].short).join(', ')} +${value.length - 3}`;
  }

  return (
    <div className="tiebreak-picker-shell">
      <button
        type="button"
        className="tiebreak-picker-header"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
      >
        <span className="tiebreak-picker-title">Critérios de desempate</span>
        <span className="tiebreak-picker-summary">{summaryLabel()}</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div className="tiebreak-picker-body">
          {value.length === 0 ? (
            <p className="tiebreak-empty">Nenhum critério selecionado.</p>
          ) : (
            <div className="tiebreak-list">
              {value.map((kind, index) => (
                <div
                  key={kind}
                  className="tiebreak-item"
                  draggable
                  onDragStart={() => setDraggedKind(kind)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(kind)}
                >
                  <GripVertical size={14} className="tiebreak-grip" />
                  <span className="tiebreak-rank">{index + 1}</span>
                  <span className="tiebreak-name">{TIEBREAK_LABELS[kind].long}</span>
                  <button
                    type="button"
                    className="tiebreak-remove"
                    aria-label={`Remover ${TIEBREAK_LABELS[kind].long}`}
                    onClick={() => onChange(value.filter((item) => item !== kind))}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {availableChoices.length > 0 && (
            <div className="tiebreak-add-menu">
              {availableChoices.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className="tiebreak-add-item"
                  onClick={() => {
                    onChange([...value, kind]);
                  }}
                >
                  {TIEBREAK_LABELS[kind].long}
                </button>
              ))}
            </div>
          )}

          {availableChoices.length === 0 && (
            <button type="button" className="tiebreak-add-cta" disabled>
              Nenhum critério disponível
            </button>
          )}
        </div>
      )}
    </div>
  );
}
