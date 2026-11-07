import { useRef, useState } from 'react';

const STEP = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

// Keyboard focus moves mark to mark (Charts board, "Hover and the table"): one tab stop per chart, the arrow
// keys, Home and End move it, and the mark it lands on opens its tooltip. Hover opens a mark's tooltip; a tap
// (a phone has no hover) toggles it. markProps(i) goes on the element that is mark i's hit area: the whole row.
// show(i) opens mark i's tooltip from elsewhere (a drag across a plot of narrow columns).
const keyboardFocus = (node) => {
  try {
    return node.matches(':focus-visible');
  } catch {
    return false;
  }
};

const useMarkFocus = (count) => {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(null);
  const marks = useRef([]);
  const close = (index) => setOpen((current) => (current === index ? null : current));
  const move = (index) => {
    const next = Math.max(0, Math.min(count - 1, index));
    setActive(next);
    setOpen(next);
    marks.current[next]?.focus();
  };
  const markProps = (index) => ({
    ref: (node) => {
      marks.current[index] = node;
    },
    tabIndex: index === Math.min(active, count - 1) ? 0 : -1,
    onFocus: (event) => {
      setActive(index);
      // Tab opens the tooltip; a tap's focus leaves it to the click.
      if (keyboardFocus(event.currentTarget)) setOpen(index);
    },
    onBlur: () => close(index),
    // A mouse only: a tap also fires mouseenter just before its click, which would open and then toggle shut.
    onPointerEnter: (event) => {
      if (event.pointerType === 'mouse') setOpen(index);
    },
    onPointerLeave: (event) => {
      if (event.pointerType === 'mouse') close(index);
    },
    onClick: (event) => {
      if (event.nativeEvent.pointerType !== 'mouse') setOpen(open === index ? null : index);
    },
    onKeyDown: (event) => {
      if (event.key in STEP) move(index + STEP[event.key]);
      else if (event.key === 'Home') move(0);
      else if (event.key === 'End') move(count - 1);
      else if (event.key === 'Escape') setOpen(null);
      else return;
      event.preventDefault();
    }
  });
  return { open, show: setOpen, markProps };
};

export default useMarkFocus;
