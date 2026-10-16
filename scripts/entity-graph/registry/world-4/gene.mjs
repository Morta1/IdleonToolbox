import { linked } from '../../../../utility/wiki/field-links.mjs';
import { sentence, tidy } from '../text.mjs';

// Field values render as written, so game text is spaced (and its `@` breaks made sentences) here.
const spaced = (text) => tidy(text).replace(/_/g, ' ');

// UPKEEP: PetGenes[i][1] is the gene's family. N.js PetStuff counts type 0 in Trek_FightPower and type 1 in Trekking; 2 and 3 are the Breeder and Shiny rolls, which only act in the Fence Yard. Not extracted: a type means only which PetStuff formula reads it, and no table names it.
const TYPES = { 0: 'Combat', 1: 'Foraging', 2: 'Fence Yard', 3: 'Fence Yard' };

export default {
  kind: 'gene',
  section: 'petGenes',
  // UPKEEP: keyed by table position (the save stores a Mob's gene as this index); the art (GeneReady<i>) follows it.
  key: (entry, index) => `Gene${index}`,
  icon: (entry, index) => `/data/GeneReady${index}.png`,
  fallbackIcon: '/data/GeneReady0.png',
  // UPKEEP: the game's own placeholder rows at the end of PetGenes.
  skip: (entry) => (entry.name === 'GeneName' ? 'filler row' : false),
  describe: (entry) => sentence(tidy(entry.combatAbility)),
  fields: (entry, index, data) => {
    const mobs = (data.petStats || []).flat().filter((mob) => mob?.gene?.index === index);
    const carriers = mobs.map((mob) => spaced(mob.monsterName));
    return [
      { label: 'Type', value: TYPES[entry.abilityType] },
      { label: 'Bonus', value: spaced(entry.bonusAbility) },
      ...(carriers.length
        ? [linked({ label: 'Mobs with this gene', value: carriers }, 'features', ...mobs.map((mob) => `monster:${mob.monsterRawName}`))]
        : [])
    ];
  }
};
