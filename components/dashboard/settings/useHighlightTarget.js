import { useEffect, useRef, useState } from 'react';

// How long the setting an alert pointed at stays tinted after the window opens on it.
export const HIGHLIGHT_DURATION = 1600;

// Scrolls the row a dashboard alert asked for into view and fades its tint out again.
export const useHighlightTarget = (active) => {
  const ref = useRef(null);
  const [highlighted, setHighlighted] = useState(active);

  useEffect(() => {
    if (!active || !ref.current) return;
    ref.current.scrollIntoView({ block: 'center' });
    const timeout = setTimeout(() => setHighlighted(false), HIGHLIGHT_DURATION);
    return () => clearTimeout(timeout);
  }, [active]);

  return [ref, highlighted];
};
