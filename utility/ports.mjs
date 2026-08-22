import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Each worktree owns a slot so several sessions can run dev + e2e side by side.
// Slot 0 (the main worktree, no marker file) keeps the historical 3001/3002 pair,
// slot 1 gets 3011/3012, slot 2 gets 3021/3022, and so on.
export const portsForSlot = (slot) => ({ devPort: 3001 + slot * 10, e2ePort: 3002 + slot * 10 });

const readSlot = () => {
  if (process.env.IT_SLOT) return Number(process.env.IT_SLOT) || 0;
  try {
    return Number(readFileSync(join(root, '.worktree-slot'), 'utf8').trim()) || 0;
  } catch {
    return 0;
  }
};

export const slot = readSlot();
export const devPort = Number(process.env.PORT ?? portsForSlot(slot).devPort);
export const e2ePort = Number(process.env.E2E_PORT ?? portsForSlot(slot).e2ePort);
