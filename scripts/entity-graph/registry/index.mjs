import world1 from './world-1/index.mjs';
import world2 from './world-2/index.mjs';
import world3 from './world-3/index.mjs';
import world4 from './world-4/index.mjs';

// Every registry kind, in nav order. A group's rows come from its own folder's index.mjs.
export const ROWS = [...world1, ...world2, ...world3, ...world4];
