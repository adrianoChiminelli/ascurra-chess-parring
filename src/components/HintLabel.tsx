import { HelpCircle } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface HintLabelProps {
  label: string;
  description: string;
}

const GAP = 8;
const VIEWPORT_MARGIN = 8;

// Tooltip renderizado no body com position: fixed, para não ser cortado nem
// aumentar a área rolável de containers com overflow (ex.: tabela do placar).
export function HintLabel({ label, description }: HintLabelProps) {
  const iconRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const icon = iconRef.current;
    const tooltip = tooltipRef.current;
    if (!open || !icon || !tooltip) return;

    const anchor = icon.getBoundingClientRect();
    const { width } = tooltip.getBoundingClientRect();
    const centered = anchor.left + anchor.width / 2 - width / 2;
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;

    tooltip.style.left = `${Math.max(VIEWPORT_MARGIN, Math.min(centered, maxLeft))}px`;
    tooltip.style.top = `${anchor.bottom + GAP}px`;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <span
      className="th-with-hint"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {label}
      <span ref={iconRef} className="hint-icon" tabIndex={0} aria-label={description}>
        <HelpCircle size={13} />
      </span>
      {open &&
        createPortal(
          <span ref={tooltipRef} role="tooltip" className="hint-tooltip">
            {description}
          </span>,
          document.body,
        )}
    </span>
  );
}
