import { useEffect, useSyncExternalStore } from 'react';

// The Nitro pixel, which blockers stop. 'unknown' until it answers (about 0.75 s when blocked: three
// tries 250 ms apart), then 'blocked' or 'clear'. One check per page load, shared by every reader.
let status = 'unknown';
let started = false;
const listeners = new Set();

const setStatus = (next) => {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const runDetection = () => {
  // Also how to fake a blocker by hand: document.dispatchEvent(new CustomEvent('adblock.detected')).
  document.addEventListener('adblock.detected', () => setStatus('blocked'));
  let errors = 0;
  const testImg = () => {
    const img = new Image();
    img.onerror = () => {
      errors += 1;
      if (errors < 3) {
        setTimeout(testImg, 250);
      } else {
        document.dispatchEvent(new CustomEvent('adblock.detected'));
      }
    };
    img.onload = () => setStatus('clear');
    img.src = `https://s.nitropay.com/1.gif?${Math.random()}&adslot=`;
  };
  testImg();
};

// 'unknown' at build and during hydration (the server snapshot), so the first render matches the export.
export const useAdBlockStatus = () => {
  useEffect(() => {
    if (started) return;
    started = true;
    runDetection();
  }, []);
  return useSyncExternalStore(subscribe, () => status, () => 'unknown');
};

const useAdBlockDetection = () => useAdBlockStatus() === 'blocked';

export default useAdBlockDetection;
