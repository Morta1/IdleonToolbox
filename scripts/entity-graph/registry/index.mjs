import world1 from './world-1/index.mjs';
import world2 from './world-2/index.mjs';
import world3 from './world-3/index.mjs';
import world4 from './world-4/index.mjs';
import world5 from './world-5/index.mjs';
import world6 from './world-6/index.mjs';
import world7 from './world-7/index.mjs';
import classes from './classes/index.mjs';
import account from './account/index.mjs';

// Every registry kind. A group's rows come from its own folder's index.mjs; the nav order comes from KIND_GROUPS
// (Account sits second there, after Encyclopedia).
export const ROWS = [...world1, ...world2, ...world3, ...world4, ...world5, ...world6, ...world7, ...classes, ...account];
