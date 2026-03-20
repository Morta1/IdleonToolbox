/**
 * Global type declarations.
 *
 * NOTE: The canonical type definitions now live in types/*.ts.
 * These ambient declarations exist for backward compatibility so that
 * existing .js/.jsx files (which don't import types explicitly) can
 * still reference Account, Character, etc. in JSDoc or inline comments.
 *
 * As parsers/components migrate to .ts/.tsx, prefer importing from
 * '../types' or '../types/common' instead of relying on these globals.
 */

interface Window {
  gtag?: (...args: unknown[]) => void;
}

// Re-export canonical types as ambient globals for JS files
// These mirror the shapes in types/*.ts
interface ValueAndBreakdown {
  value: number;
  breakdown: { name?: string; value?: number; title?: string }[];
}

interface Account {
  [key: string]: any;
}

interface Character {
  [key: string]: any;
}

interface Data {
  account: Account;
  characters: Character[];
}

interface IdleonData {
  [key: string]: any;
}
