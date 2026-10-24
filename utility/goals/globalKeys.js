import { isGlobalSkill } from '../consts';

// Entries every character shares (a global skill), by system: one value for the account, so any stored scope means
// the account. Data-free so the store can read it without the registry
export const GLOBAL_KEYS = { skill: isGlobalSkill };
