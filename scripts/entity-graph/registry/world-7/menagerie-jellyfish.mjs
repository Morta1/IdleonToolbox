import { linked } from '../../../../utility/wiki/field-links.mjs';
import {
  JELLY_NAMES,
  PANEL_TEXT,
  pinkLumiLine,
  pinkShellLine,
  SILVER_LINES,
  YELLOW_BONUS_NAMES
} from '../../../../utility/wiki/menagerie-jellies.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';
import menagerieUnlock, { UNLOCK_NAMES, unlockName } from './menagerie-unlock.mjs';

// What each panel lists, by jellyfish; the panel text itself is hand-kept in utility/wiki/menagerie-jellies.mjs, beside the
// Menagerie page that draws it too.
const PANEL_FIELDS = {
  Pink: () => ({ label: 'Upgrades at level 1', value: [pinkShellLine(1), pinkLumiLine(1)] }),
  Silver: () => ({ label: 'Upgrades', value: SILVER_LINES.map((line) => line.replace(/:$/, '')) }),
  Yellow: () => ({ label: 'Construction bonuses', value: YELLOW_BONUS_NAMES })
};

export default {
  kind: 'menageriejelly',
  // The menagerieUnlockUses table, MenagerieStuff SideJellyUnlocked (N.js:72993): the Menagerie unlock each jellyfish needs.
  section: (data) => {
    const unlocks = gameTable(data, 'menagerieUnlockUses')?.jellyfish;
    return JELLY_NAMES.map((name, index) => ({ name: `${name}_Jellyfish`, colour: name, panel: PANEL_TEXT[index], unlock: unlocks?.[index] ?? null }));
  },
  key: (entry, index) => `MenaJelly${index + 1}`,
  icon: (entry, index) => `/data/MenaJelly${index + 1}.png`,
  fallbackIcon: '/data/LumiJel.png',
  describe: (entry) => entry.panel,
  fields: (entry, index, data) => {
    const name = entry.unlock === null ? null : unlockName(data.research[UNLOCK_NAMES]?.[entry.unlock]);
    return [
      ...(name ? [linked({ label: 'Unlocked by', value: spaced(name) }, 'unlockedBy', nodeId(menagerieUnlock, null, entry.unlock))] : []),
      ...(PANEL_FIELDS[entry.colour] ? [PANEL_FIELDS[entry.colour]()] : [])
    ];
  }
};
