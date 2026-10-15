import { linked } from '../../../../utility/wiki/field-links.mjs';
import { spaced } from '../text.mjs';

// UPKEEP: circuit colour by Death Note world + 1, White for the Pet* opponents (summoning.ts:72-96).
const CIRCUITS = ['White', 'Green', 'Yellow', 'Blue', 'Purple', 'Red', 'Cyan', 'Teal'];
// UPKEEP: the battle panel prints 3.5 x the table quantity (N.js:109371).
const WIN_SCALE = 3.5;
// UPKEEP: the two opponents past the last released circuit; the extractor (z-processing features/world-6/summoning.js:46-62) reads their winner bonus from the endless list.
const UNRELEASED = new Set(['w7b7', 'w7b8']);
const roundTwo = (value) => Math.round(value * 100) / 100;

const circuitOf = (entry, data) => {
  // UPKEEP: the Pet* prefix marks the White circuit's opponents.
  if (/^Pet/.test(entry.enemyId)) return 0;
  const page = (data.deathNote || []).find(({ rawName }) => rawName === entry.enemyId);
  return page ? page.world + 1 : null;
};

const winnerBonus = (entry) => {
  const text = String(entry.bonus?.bonus || '');
  const value = WIN_SCALE * entry.bonusQty;
  // UPKEEP: NotateNumber "Big" floors below 1,000 (N.js:109371) and every `{` winner value is at most 70.
  return text.includes('<') ? text.replace('<', roundTwo(1 + value / 100)) : text.replace('{', Math.floor(value));
};

export default {
  kind: 'summoningbattle',
  section: 'summoningEnemies',
  // UPKEEP: keyed by enemy id, which is unique among the real battles and is the save's Summon[1] entry.
  key: (entry) => `SummonBattle_${entry.enemyId}`,
  name: (entry) => entry.territoryName,
  icon: (entry) => `/monsters/${entry.enemyId}/static.png`,
  fallbackIcon: '/data/ClassIcons59.png',
  // UPKEEP: '_' is the game's marker for an empty slot (territory name) and for an opponent off every circuit (difficulty).
  skip: (entry) => {
    if (UNRELEASED.has(entry.enemyId)) return 'unreleased: the extractor reads its winner bonus from the endless list';
    if (entry.territoryName === '_') return 'placeholder: empty slot';
    if (entry.difficulty === '_') return 'not on a circuit';
    // The stone bosses have bonusQty 0 as well; testing bonusId first gives them the clearer reason.
    if (!(entry.bonusId >= 0)) return 'summoning stone boss: no winner bonus';
    if (!(Number(entry.bonusQty) > 0)) return 'endless or Gambit opponent: no winner bonus';
    return false;
  },
  describe: (entry) => `Winner_bonus:_${winnerBonus(entry)}`,
  fields: (entry, index, data) => {
    const circuit = circuitOf(entry, data);
    return [
      { label: 'Circuit', value: circuit == null ? null : `${CIRCUITS[circuit]} circuit` },
      linked({ label: 'Opponent', value: spaced(data.monsters?.[entry.enemyId]?.Name) }, 'features', `monster:${entry.enemyId}`)
    ];
  }
};
