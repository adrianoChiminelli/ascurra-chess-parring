import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { TIEBREAK_LABELS, type TiebreakKind } from '../types';

const ALL_TIEBREAKS: TiebreakKind[] = Object.keys(TIEBREAK_LABELS) as TiebreakKind[];

interface TiebreakPickerProps {
  value: TiebreakKind[];
  onChange: (nextValue: TiebreakKind[]) => void;
}

export function TiebreakPicker({ value, onChange }: TiebreakPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableChoices = useMemo(
    () => ALL_TIEBREAKS.filter((kind) => !value.includes(kind)),
    [value],
  );

  function move(kind: TiebreakKind, direction: -1 | 1) {
    const index = value.indexOf(kind);
    if (index === -1) return;

    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= value.length) return;

    const nextValue = [...value];
    [nextValue[index], nextValue[nextIndex]] = [nextValue[nextIndex], nextValue[index]];
    onChange(nextValue);
  }

  return (
    <div className="field-group">
      <span className="field-label">Tie Breaks</span>

      <div className="tiebreak-picker">
        <div className="tiebreak-chips">
          {value.length === 0 ? (
            <span className="tiebreak-empty">Nenhum critério selecionado</span>
          ) : (
            value.map((kind, index) => (
              <div key={kind} className="tiebreak-chip">
                <span className="tiebreak-chip-text" title={TIEBREAK_LABELS[kind].long}>
                  {TIEBREAK_LABELS[kind].long}
                </span>
                <div className="tiebreak-actions">
                  <button
                    type="button"
                    className="tiebreak-move"
                    aria-label={`Mover ${TIEBREAK_LABELS[kind].long} para cima`}
                    onClick={() => move(kind, -1)}
                    disabled={index === 0}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    className="tiebreak-move"
                    aria-label={`Mover ${TIEBREAK_LABELS[kind].long} para baixo`}
                    onClick={() => move(kind, 1)}
                    disabled={index === value.length - 1}
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    type="button"
                    className="tiebreak-remove"
                    aria-label={`Remover ${TIEBREAK_LABELS[kind].long}`}
                    onClick={() => onChange(value.filter((item) => item !== kind))}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="tiebreak-dropdown-wrap">
          <button
            type="button"
            className="tiebreak-dropdown-button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-label="Adicionar critério de desempate"
            disabled={availableChoices.length === 0}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isOpen && availableChoices.length > 0 && (
            <div className="tiebreak-menu" role="menu">
              {availableChoices.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className="tiebreak-menu-item"
                  onClick={() => {
                    onChange([...value, kind]);
                    setIsOpen(false);
                  }}
                >
                  {TIEBREAK_LABELS[kind].long}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
