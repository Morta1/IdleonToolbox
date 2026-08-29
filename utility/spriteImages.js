import { prefix } from '@utility/helpers';
import spriteManifest from '../data/sprite-manifest.json';

const GIF_VARIANTS = new Set(['idle', 'walk', 'death']);

// Pure lookup, takes the manifest as a parameter so it can be tested without module mocking.
// Full <img src> for a monster. Accepts rawName or display Name.
// Fallback chain: requested variant -> static -> face icon -> legacy afk_targets path.
export const monsterImageFrom = (manifest, nameOrRaw, variant = 'static') => {
  const rawName = manifest.monsters?.[nameOrRaw]
    ? nameOrRaw
    : manifest.monstersByName?.[nameOrRaw];
  const entry = manifest.monsters?.[rawName];
  if (!entry) return `${prefix}afk_targets/${nameOrRaw}.png`;
  if (variant === 'face') {
    if (entry.face != null && entry.face !== 0) return `${prefix}data/Mface${entry.face}.png`;
    variant = 'static';
  }
  if (entry.variants.includes(variant)) {
    return `${prefix}monsters/${rawName}/${variant}.${GIF_VARIANTS.has(variant) ? 'gif' : 'png'}`;
  }
  if (entry.variants.includes('static')) return `${prefix}monsters/${rawName}/static.png`;
  if (entry.face != null && entry.face !== 0) return `${prefix}data/Mface${entry.face}.png`;
  return `${prefix}afk_targets/${nameOrRaw}.png`;
};

// Pure lookup, takes the manifest as a parameter so it can be tested without module mocking.
// Full <img src> for an NPC (roster name). Static by default: animations belong to the wiki's
// entity page, not to list rows. Falls back to the legacy flat gif for hand-added art that is
// not in the roster (Chesty, Captain, Boat).
export const npcImageFrom = (manifest, name, variant = 'static') => {
  const variants = manifest.npcs?.[name];
  if (!variants) return `${prefix}npcs/${name}.gif`;
  if (variants.includes(variant)) {
    return `${prefix}npcs/${name}/${variant}.${variant === 'static' ? 'png' : 'gif'}`;
  }
  if (variants.includes('static')) return `${prefix}npcs/${name}/static.png`;
  return `${prefix}npcs/${name}.gif`;
};

// Thin wrappers bound to the real manifest. Public API unchanged for the ~18 callers.
export const monsterImage = (nameOrRaw, variant = 'static') =>
  monsterImageFrom(spriteManifest, nameOrRaw, variant);

export const npcImage = (name, variant = 'static') =>
  npcImageFrom(spriteManifest, name, variant);

// Moved from helpers.js; now returns a complete src (callers no longer add prefix/.png).
export const getActivityIcon = (character) => {
  const { afkTarget, targetMonster, monsterFace } = character || {};
  if (!afkTarget || afkTarget === '_' || afkTarget === 'Nothing') return `${prefix}data/Afkz5.png`;
  if (monsterFace != null && monsterFace !== 0) return `${prefix}data/Mface${monsterFace}.png`;
  if (targetMonster) return `${prefix}data/${targetMonster}_x1.png`;
  return monsterImage(afkTarget);
};
