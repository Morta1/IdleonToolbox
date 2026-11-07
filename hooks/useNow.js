import { useSyncExternalStore } from 'react';

// The clock as an external store, so a render can read the time and stay pure. The build and hydration read 0: gate what
// reads it. A reading holds for a whole tick, because React compares snapshots and a new one on every read would loop.
const readings = new Map();

const read = (tick) => {
  const clock = Date.now();
  if (Math.abs(clock - (readings.get(tick) ?? 0)) >= tick) readings.set(tick, clock);
  return readings.get(tick);
};

const useNow = (tick = 1000) => useSyncExternalStore((changed) => {
  const timer = setInterval(changed, tick);
  return () => clearInterval(timer);
}, () => read(tick), () => 0);

export default useNow;
