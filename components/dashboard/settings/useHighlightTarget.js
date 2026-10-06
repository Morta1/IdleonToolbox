import { useEffect, useRef, useState } from 'react';

// How long the setting an alert pointed at stays tinted after the window opens on it.
export const HIGHLIGHT_DURATION = 1600;

// Scrolls the row a dashboard alert asked for into view and fades its tint out again. `key`
// changes on every jump, so jumping to the same row twice tints it twice.
export const useHighlightTarget = (active, key = null) => {
  const ref = useRef(null);
  const [highlighted, setHighlighted] = useState(active);
  const [seen, setSeen] = useState({ active, key });

  // Rows are often already mounted when they become the target (deep link into the section on
  // screen, nav jumps), so the tint follows `active` instead of only the first render.
  if (seen.active !== active || seen.key !== key) {
    setSeen({ active, key });
    setHighlighted(active);
  }

  useEffect(() => {
    if (!active) return;
    ref.current?.scrollIntoView({ block: 'center' });
    const timeout = setTimeout(() => setHighlighted(false), HIGHLIGHT_DURATION);
    return () => clearTimeout(timeout);
  }, [active, key]);

  return [ref, highlighted];
};
