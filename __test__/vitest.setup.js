// With vitest's isolate:false the module cache is shared, so @testing-library's own
// afterEach(cleanup) registers against whichever file imported it first and every later file
// leaves its render mounted for the next one to trip over.
import { afterEach } from 'vitest';

afterEach(async () => {
  if (typeof document === 'undefined') return;
  const { cleanup } = await import('@testing-library/react');
  cleanup();
});
