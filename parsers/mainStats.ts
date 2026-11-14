import { bonuses, cardBonuses } from '@website-data';
import { additiveGroup, createBreakdown, evaluateBreakdownNode as evaluate, flat, NUMBERED_GROUP, percent, productGroup, sourceName, sumGroup } from '@parsers/breakdown';
import type { BreakdownNode, StatBreakdown } from '@parsers/breakdown';
import { getStatsFromGear } from '@parsers/items';
import { getObolsBonus } from '@parsers/obols';
import { getHighestTalentAcrossCharacters, getTalentBonus, getTalentBonusIfActive, mainStatMap } from '@parsers/talents';
import { getStampNode, getStampsBonusByStat } from '@parsers/world-1/stamps';
import { bubbleLineName, getBubbleBonus, getSigilBonus, getVialsBonusByStat } from '@parsers/world-2/alchemy';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getOwlBonus } from '@parsers/world-1/owl';
import { getShinyBonus } from '@parsers/world-4/breeding';
import { getPostOfficeBonus } from '@parsers/world-3/postoffice';
import { getCharacterFamilyBonus } from '@parsers/family';
import { getStarSignBonus } from '@parsers/starSigns';
import { getCardBonusByEffect } from '@parsers/cards';
import { getMealsBonusByEffectOrStat } from '@parsers/world-4/cooking';
import { getGuildBonusBonus } from '@parsers/guild';
import { getCharmBonus } from '@parsers/world-6/sneaking';
import { getTomeBubbleMulti } from '@parsers/world-4/tome';
import { getGrimoireBonus } from '@parsers/class-specific/grimoire';
import { getArmorSetBonus } from '@parsers/world-3/armorSmithy';
import { isArtifactAcquired } from '@parsers/world-5/sailing';
import { getAchievementStatus } from '@parsers/achievements';
import { getLandRank } from '@parsers/world-6/farming';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getJewelBonus } from '@parsers/world-4/lab';
import { getCosmoBonus } from '@parsers/world-5/hole';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import { calcTotalQuestCompleted, getCompanionBonus, getGoldenFoodBonus, isCompanionBonusActive } from '@parsers/misc';
import { CLASSES } from '@parsers/talents';
import { OPT } from '@parsers/accountOptions';
import { lavaLog } from '@utility/helpers';

export type MainStat = 'strength' | 'agility' | 'wisdom' | 'luck';

// game: _customBlock_TotalStats("STR" | "AGI" | "WIS" | "LUK"), outside a dungeon. Every per-stat id below is the
// game's own: EtcBonuses, talents, bubbles, pristine charm, shiny, arcade, family and post office slots.
const STATS: Record<MainStat, any> = {
  strength: {
    key: 'STR', etcPct: 57, etcBase: 51, pristine: 'Sugar_Bomb', family: CLASSES.Warrior, card: 9, sigil: 'BIG_MUSCLE',
    shiny: 'Base_STR', arcade: 19, shimmer: OPT.shimmerStrLevel,
    gearTalent: "'STR'ESS_TESTED_GARB", obolTalent: 'FISTFUL_OF_OBOL', pctTalent: 'OVERBLOWN_TESTOSTERONE',
    baseTalents: ['FIST_OF_RAGE', 'ABSOLUTE_UNIT', 'BUILT_DIFFERENT'], starTalent: 'ETERNAL_STR', skillTalent: 'SKILL_STRENGTHEN',
    buffTalent: 'FIRMLY_GRASP_IT', totalBubble: 'ROID_RAGIN', tomeBubble: 'TOME_STRENGTH', slabBubble: 'SLABI_STRENGTH',
    boxes: [['Gaming_Lootcrate', 1]]
  },
  agility: {
    key: 'AGI', etcPct: 25, etcBase: 52, pristine: 'Fruit_Rolle', family: CLASSES.Archer, card: 7, sigil: 'PUMPED_KICKS',
    shiny: 'Base_AGI', arcade: 20, shimmer: OPT.shimmerAgiLevel,
    gearTalent: "GARB_OF_UN'AGI'NG_QUALITY", obolTalent: 'SHOEFUL_OF_OBOL', pctTalent: 'ADAPTATION_REVELATION',
    baseTalents: ['QUICKNESS_BOOTS', 'SANIC_SPEED', 'UNREAL_AGILITY'], starTalent: 'ETERNAL_AGI', skillTalent: 'SKILL_AMBIDEXTERITY',
    totalBubble: 'SWIFT_STEPPIN', tomeBubble: 'TOME_AGILITY', slabBubble: 'SLABO_AGILITY',
    boxes: [["Scurvy_C'arr'ate", 1]]
  },
  wisdom: {
    key: 'WIS', etcPct: 58, etcBase: 53, pristine: 'Lollipop_Law', family: CLASSES.Mage, card: 5, sigil: 'ODD_LITEARTURE',
    shiny: 'Base_WIS', arcade: 21, shimmer: OPT.shimmerWisLevel,
    gearTalent: "UNT'WIS'TED_ROBES", obolTalent: 'OCCULT_OBOLS', pctTalent: 'UTMOST_INTELLECT',
    baseTalents: ['BOOK_OF_THE_WISE', 'INDIVIDUAL_INSIGHT', 'INDIVIDUALITY'], starTalent: 'ETERNAL_WIS', skillTalent: 'SKILL_WIZ',
    totalBubble: 'STABLE_JENIUS', tomeBubble: 'TOME_WISDOM', slabBubble: 'SLABE_WISDOM',
    boxes: [['Box_of_Gosh', 1]]
  },
  luck: {
    key: 'LUK', etcPct: 17, etcBase: 54, pristine: 'Gumm_Eye', family: CLASSES.Journeyman, card: 2, sigil: 'GOOD_FORTUNE',
    shiny: 'Base_LUK', arcade: 22, shimmer: OPT.shimmerLukLevel,
    gearTalent: "F'LUK'EY_FABRICS", obolTalent: 'CLEVER_CLOVER_OBOLS',
    baseTalents: ['LUCKY_CLOVER', 'LUCKY_HORSESHOE'], starTalent: 'ETERNAL_LUK', questTalent: 'QUEST_CHUNGUS',
    totalBubble: 'LOTTO_SKILLS', slabBubble: 'SLABO_AGILITY',
    boxes: [['Science_Spare_Parts', 2], ['Non_Predatory_Loot_Box', 1]]
  }
};

const talentLine = (character: any, name: string, list = character?.flatTalents) =>
  flat(sourceName('Talent', name), getTalentBonus(list, name));

// Talents past id 600 sit on the star talent pages
const anyTalent = (character: any, name: string) =>
  getTalentBonus(character?.flatTalents, name) || getTalentBonus(character?.flatStarTalents, name);

const etcBonus = (character: any, account: any, index: number) =>
  getStatsFromGear(character, index, account).value + getObolsBonus(character?.obols, bonuses?.etcBonuses?.[index]);

// game: ArbitraryCode("AllStatPCT"), the % all stats every main stat reads
export const getAllStatPercentNode = (character: any, account: any, characters: any[]): BreakdownNode => {
  const dummyTalent = anyTalent(character, 'DUMMY_THICC_STATS');
  const tree = sumGroup('All stats', [
    percent('Vials', getVialsBonusByStat(account?.alchemy?.vials, 'AllStatPCT')),
    percent('King Doot', 15 * (isCompanionBonusActive(account, 0) ? 1 : 0)
      * getCosmoBonus({ majik: account?.hole?.holesObject?.idleonMajiks, t: 2, i: 0 })),
    percent('Lab Jewel', getJewelBonus(account?.lab?.jewels, 4)),
    getStampNode(account, { stat: 'AllStatPct' }, getStampsBonusByStat(account, 'AllStatPct', character), character),
    percent('Cards', getCardBonusByEffect(character?.cards?.equippedCards, cardBonuses[82])),
    percent('Summoning', getWinnerBonus(account, '+{% All Stat')),
    percent(sourceName('Family', CLASSES.Bubonic_Conjuror), getCharacterFamilyBonus(character, CLASSES.Bubonic_Conjuror)),
    percent(sourceName('Artifact', 'Socrates'), isArtifactAcquired(account?.sailing?.artifacts, 'Socrates')?.bonus ?? 0),
    percent('Golden food', getGoldenFoodBonus('Golden_Grilled_Cheese_Nomwich', character, account, characters)),
    percent('Achievements', getAchievementStatus(account?.achievements, 309) + getAchievementStatus(account?.achievements, 362)),
    percent(sourceName('Talent', 'DUMMY_THICC_STATS'), Math.min(15, lavaLog(account?.accountOptions?.[OPT.shimmerBestDps] ?? 0) * dummyTalent)),
    percent('Sneaking mastery', 10 * Math.floor((98 + (account?.accountOptions?.[OPT.ninjaMasteryTier] ?? 0)) / 100)),
    percent('Land rank', getLandRank(account?.farming?.ranks, 19, characters, character) ?? 0),
    percent('Ballot', getVoteBonus(account, 2)),
    percent(sourceName('Set', 'MARBIGLASS_SET'), getArmorSetBonus(account, 'MARBIGLASS_SET'))
  ]);
  return tree;
};

// The save's STR/AGI/WIS/LUK, as the game last calculated it, with the sources TotalStats adds up behind it.
// Whatever those sources don't reach shows as its own line, so the drawer always adds up to the stat.
export const getMainStatInfo = (character: any, account: any, characters: any[], stat: MainStat): { value: number, breakdown: StatBreakdown } => {
  const value = character?.stats?.[stat] ?? 0;
  const cfg = STATS[stat];
  // A bubble gets the class multiplier when its cauldron is the character's own: LUK reads Slabo Agility, an AGI bubble
  const ownCauldron = (bubbleStat: MainStat) => (mainStatMap as Record<string, string>)?.[character?.class] === bubbleStat;
  const bubbleStat: MainStat = stat === 'luck' ? 'agility' : stat;

  const gear = getStatsFromGear(character, cfg.key, account).newBreakdown?.sources ?? [];
  const gearGroup = productGroup('Equipment', [
    sumGroup(NUMBERED_GROUP, gear.map(({ name, value: v }: any) => flat(name, v))),
    additiveGroup(NUMBERED_GROUP, [
      percent(sourceName('Talent', cfg.gearTalent), getTalentBonus(character?.flatTalents, cfg.gearTalent)),
      getStampNode(account, { stat: `Pct${cfg.key}` }, getStampsBonusByStat(account, `Pct${cfg.key}`, character), character)
    ])
  ], { unit: 'flat' });
  const obolsGroup = productGroup('Obols', [
    flat('Obols', getObolsBonus(character?.obols, cfg.key)),
    additiveGroup(NUMBERED_GROUP, [
      percent(sourceName('Talent', cfg.obolTalent), getTalentBonus(character?.flatTalents, cfg.obolTalent)),
      percent('Superbit', isSuperbitUnlocked(account, 'obol_stat_booster') ? 40 : 0)
    ])
  ], { unit: 'flat' });

  const slabItems = Math.floor((account?.looty?.rawLootedItems ?? 0) / 100);
  const highestLevel = Math.max(0, ...(characters ?? []).map(({ level }: any) => level ?? 0));
  const allStats = [
    flat(sourceName('Talent', 'WILL_OF_THE_ELDEST'), Math.min(anyTalent(character, 'WILL_OF_THE_ELDEST'), Math.floor(highestLevel / 10))),
    getStampNode(account, { stat: 'BaseAllStat' }, getStampsBonusByStat(account, 'BaseAllStat', character), character, 'flat'),
    flat('Post office', getPostOfficeBonus(character?.postOffice, 'Myriad_Crate', 0)),
    flat('Meals', getMealsBonusByEffectOrStat(account, null, 'Stat')),
    flat('Guild', getGuildBonusBonus(account?.guild?.guildBonuses, 1)),
    flat(sourceName('Owl', 'All Stat'), getOwlBonus(account?.owl?.bonuses, 'All Stat') ?? 0)
  ];
  const flatGroup = sumGroup('Base bonuses', [
    ...cfg.baseTalents.map((name: string) => talentLine(character, name)),
    flat(sourceName('Star Talent', cfg.starTalent), getHighestTalentAcrossCharacters(characters, cfg.starTalent, character)),
    ...(cfg.skillTalent ? [flat(sourceName('Talent', cfg.skillTalent), getTalentBonus(character?.flatTalents, cfg.skillTalent, true))] : []),
    ...(cfg.buffTalent ? [flat(sourceName('Talent', cfg.buffTalent), getTalentBonusIfActive(character?.activeBuffs, cfg.buffTalent))] : []),
    ...(cfg.questTalent ? [flat(sourceName('Talent', cfg.questTalent),
      Math.min(Number(calcTotalQuestCompleted(characters)) || 0, anyTalent(character, cfg.questTalent)))] : []),
    getStampNode(account, { stat: `Base${cfg.key}` }, getStampsBonusByStat(account, `Base${cfg.key}`, character), character, 'flat'),
    flat('Equipment bonus', etcBonus(character, account, cfg.etcBase)),
    flat('Shimmer', (account?.accountOptions?.[cfg.shimmer] ?? 0) * (account?.islands?.allShimmerBonus ?? 0)),
    flat(sourceName('Family', cfg.family), getCharacterFamilyBonus(character, cfg.family)),
    flat('Star Signs', getStarSignBonus(character, account, cfg.key, false, false, [`+{_${cfg.key}`, '+{_All_Stats'])),
    flat('Post office', cfg.boxes.reduce((sum: number, [box, index]: [string, number]) => sum + getPostOfficeBonus(character?.postOffice, box, index), 0)),
    flat('Cards', getCardBonusByEffect(character?.cards?.equippedCards, cardBonuses[cfg.card])),
    flat(sourceName('Sigil', cfg.sigil), getSigilBonus(account?.alchemy?.p2w?.sigils, cfg.sigil)),
    flat(bubbleLineName(cfg.slabBubble), getBubbleBonus(account, cfg.slabBubble, false, ownCauldron(bubbleStat)) * slabItems),
    flat('Shiny pets', getShinyBonus(account?.breeding?.pets, cfg.shiny)),
    flat('Arcade', getArcadeBonus(account?.arcade?.shop, cfg.arcade)?.bonus ?? 0),
    sumGroup('All stats', allStats)
  ]);

  const tomeMulti = getTomeBubbleMulti(account?.tome?.totalPoints ?? 0)
    * (1 + (getGrimoireBonus(account?.grimoire?.upgrades, 17) + getArmorSetBonus(account, 'TROLL_SET')) / 100);
  const percentGroup = additiveGroup('% bonus', [
    ...(cfg.pctTalent ? [percent(sourceName('Talent', cfg.pctTalent), getTalentBonus(character?.flatTalents, cfg.pctTalent))] : []),
    percent('Equipment bonus', etcBonus(character, account, cfg.etcPct)),
    percent('Equipment bonus (All stats)', etcBonus(character, account, 46)),
    getAllStatPercentNode(character, account, characters),
    percent(sourceName('Pristine Charm', cfg.pristine), getCharmBonus(account, cfg.pristine)),
    percent('Star Signs', getStarSignBonus(character, account, cfg.key, false, false, [`+{%_${cfg.key}`, '+{%_All_Stat'])),
    ...(cfg.tomeBubble ? [percent(bubbleLineName(cfg.tomeBubble), getBubbleBonus(account, cfg.tomeBubble, false, ownCauldron(stat)) * tomeMulti)] : [])
  ]);

  const outside = [
    flat(bubbleLineName(cfg.totalBubble), getBubbleBonus(account, cfg.totalBubble, false, ownCauldron(stat))),
    flat(sourceName('Talent', 'STAT_OVERLOAD'), anyTalent(character, 'STAT_OVERLOAD')),
    flat('Companions', getCompanionBonus(account, 8))
  ];
  const tree: BreakdownNode[] = [
    productGroup(`${cfg.key} with % bonus`, [sumGroup(`Base ${cfg.key}`, [gearGroup, obolsGroup, flatGroup], { unit: 'flat' }), percentGroup], { unit: 'flat' }),
    ...outside
  ];
  return { value, breakdown: withRemainder(cfg.key, value, tree) };
};

// The line that closes the gap between the sources and the stat the game saved
const withRemainder = (statName: string, value: number, tree: BreakdownNode[]): StatBreakdown => {
  const computed = tree.reduce((sum, node) => sum + evaluate(node), 0);
  const rest = value - computed;
  return createBreakdown(statName, value, [
    ...tree,
    ...(Math.abs(rest) >= 1 ? [flat('Other sources', rest, { note: 'Sources not listed above, plus gains since the game last saved this character' })] : [])
  ], { combine: 'sum' });
};

