import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { repoRelative, sourceFiles } from './helpers/source-files';

// CardTitleAndValue and CardWithBreakdown are StatTile under its old names (styles.jsx, Breakdown/CardWithBreakdown.jsx).
// New code imports StatTile; the files below still use an old name and move over with their page pass. A file that
// drops the old import leaves this list in the same commit, and phase 6 deletes the aliases once it is empty.
const SCANNED_DIRS = ['components', 'pages', 'hooks'];

const LEGACY_IMPORT = /\bimport\s*\{[^}]*\b(?:CardTitleAndValue|CardWithBreakdown)\b[^}]*\}\s*from\b/;

const LEGACY_IMPORTERS = [
  'components/account/Misc/class-specific/Compass/Abominations.jsx',
  'components/account/Misc/class-specific/Compass/Medallions.jsx',
  'components/account/Misc/class-specific/Compass/Portals.jsx',
  'components/account/Misc/class-specific/RoyalGuardian/Outposts.jsx',
  'components/account/Misc/class-specific/RoyalGuardian/Resources.jsx',
  'components/account/Misc/class-specific/RoyalGuardian/RoyalStatues.jsx',
  'components/account/Misc/class-specific/Tesseract/Maps.jsx',
  'components/account/Pets/PetMart.jsx',
  'components/account/Worlds/World3/Construction/CogStatCalculator.jsx',
  'components/account/Worlds/World3/Equinox/Upgrades.jsx',
  'components/account/Worlds/World3/Worship/Charge.jsx',
  'components/account/Worlds/World3/Worship/MsaTotalizer.jsx',
  'components/account/Worlds/World3/Worship/Totems.jsx',
  'components/account/Worlds/World4/Breeding/Pets/Other.jsx',
  'components/account/Worlds/World4/Breeding/Territory.jsx',
  'components/account/Worlds/World4/CookingMastery.jsx',
  'components/account/Worlds/World4/Kitchens.jsx',
  'components/account/Worlds/World4/Ribbons.jsx',
  'components/account/Worlds/World4/Rift/ConstructMastery.jsx',
  'pages/account/class-specific/compass.jsx',
  'pages/account/class-specific/grimoire.jsx',
  'pages/account/class-specific/royal-armory.jsx',
  'pages/account/class-specific/speedrun.jsx',
  'pages/account/class-specific/tesseract.jsx',
  'pages/account/clickers/bubba.jsx',
  'pages/account/clickers/kangaroo.jsx',
  'pages/account/clickers/owl.jsx',
  'pages/account/misc/dungeons.jsx',
  'pages/account/misc/event-shop.jsx',
  'pages/account/misc/friends-stats.jsx',
  'pages/account/misc/guild.jsx',
  'pages/account/misc/quests.jsx',
  'pages/account/misc/storage.jsx',
  'pages/account/misc/tournament.jsx',
  'pages/account/misc/upgrade-vault.jsx',
  'pages/account/prem-currency/bundles.jsx',
  'pages/account/prem-currency/gem-shop.jsx',
  'pages/account/prem-currency/pets.jsx',
  'pages/account/task-board/achievements.jsx',
  'pages/account/task-board/merits.jsx',
  'pages/account/task-board/tasks.jsx',
  'pages/account/task-board/unlocks.jsx',
  'pages/account/world-1/forge.jsx',
  'pages/account/world-1/stamps.jsx',
  'pages/account/world-2/arcade-shop.jsx',
  'pages/account/world-2/islands.jsx',
  'pages/account/world-2/killroy.jsx',
  'pages/account/world-2/sigils.jsx',
  'pages/account/world-2/vials.jsx',
  'pages/account/world-2/vote-ballot.jsx',
  'pages/account/world-2/weekly-bosses.jsx',
  'pages/account/world-3/armor-smithy.jsx',
  'pages/account/world-3/atom-collider.jsx',
  'pages/account/world-3/buildings.jsx',
  'pages/account/world-3/death-note.jsx',
  'pages/account/world-3/equinox.jsx',
  'pages/account/world-3/hat-rack.jsx',
  'pages/account/world-3/printer.jsx',
  'pages/account/world-3/refinery.jsx',
  'pages/account/world-3/traps.jsx',
  'pages/account/world-4/breeding.jsx',
  'pages/account/world-4/tome.jsx',
  'pages/account/world-5/slab.jsx',
  'pages/tools/material-tracker.jsx'
];

describe('StatTile legacy names', () => {
  it('are imported only by the files that already used them', () => {
    const found = sourceFiles(SCANNED_DIRS)
      .filter((file) => LEGACY_IMPORT.test(fs.readFileSync(file, 'utf8')))
      .map(repoRelative);
    expect({
      // Import StatTile from '@components/common/cards/StatTile' instead, with label and info.
      added: found.filter((file) => !LEGACY_IMPORTERS.includes(file)),
      // Moved to StatTile: take the file off LEGACY_IMPORTERS.
      gone: LEGACY_IMPORTERS.filter((file) => !found.includes(file))
    }).toEqual({ added: [], gone: [] });
  });
});
