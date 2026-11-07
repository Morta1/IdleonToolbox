import React, { useState } from 'react';
import { cleanUnderscore, fillMissingTalents, formatNum } from 'utility/helpers';
import { Box, IconButton, Stack } from '@mui/material';
import { TalentTooltip } from '../common/styles';
import { Breakdown } from '../common/Breakdown/Breakdown';
import { isBookEligibleTalent, isRoyalGuardianTalent } from '@parsers/talents';
import { ARMORY_TALENT_REATTAINMENT, getArmoryUpgradeBonus } from '@parsers/class-specific/royalGuardian';
import { createBreakdown, flat } from '@parsers/breakdown';
import Tabber from '../common/Tabber';
import ViewSwitch from '../common/ViewSwitch';
import GameIcon from '../common/GameIcon';
import StatusText from '../common/StatusText';
import Panel from '../common/cards/Panel';
import CardGrid from '../common/cards/CardGrid';
import IconTile from '../common/cards/IconTile';
import { pointsSpent } from './sectionSummary';
import InUseDot from './InUseDot';

const LOCK = 'data/UISkillIconLocke.png';
// A talent is its sprite, so the sprite takes its tile: 48 px, the most a tile holds with six characters to a row (about
// 52 px a tile), where 40 drew a 36 px speck
const TALENT_ICON = 48;
// A star talent page's 13 talents, with its two arrows in their slots
const STAR_PAGE_SIZE = 13;
const STAR_PAGES = 5;
const STAR_ARROW_SLOTS = [10, 14];
// Preset and page tabs in one block, and the two numbers on one row: an added-levels glyph keeps its slot in each
const CONTROLS_SX = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: '6px' };
const PRESET_SX = { '& .MuiToggleButton-root': { px: { xs: 1, sm: '10px' }, height: 32, fontSize: 13, fontWeight: 400 } };
const POINTS_SX = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: '12px', mb: 1, '& > .MuiStack-root': { borderTop: 0 } };

const getStarTalentPage = (talents, index) => {
  const page = talents.slice(index * STAR_PAGE_SIZE, (index + 1) * STAR_PAGE_SIZE);
  const full = Array.from({ length: STAR_PAGE_SIZE }, (_, slot) => page[slot] ?? {});
  return STAR_ARROW_SLOTS.reduce((slots, slot) => slots.toSpliced(slot, 0, { talentId: 'arrow' }), full);
};

// The game's arrow, in its slot on the star pages
const ArrowSlot = ({ label, src, onClick }) => <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44 }}>
  {onClick ? <IconButton aria-label={label} onClick={onClick} sx={{ width: 44, height: 44 }}><GameIcon src={src} size={32} alt={''}/></IconButton> : null}
</Box>;

const Talents = ({
  talents,
  starTalents,
  talentPreset,
  addedLevels,
  addedLevelsBreakdown,
  selectedTalentPreset,
  maxBookLv,
  account
}) => {
  const STAR_TAB_INDEX = Object.keys(talents || {}).length === 5 ? 5 : 4;
  const pageKeys = Object.keys(talents || {});
  // The star tab follows the pages, but STAR_TAB_INDEX is 4 for every class with fewer than five.
  const starPosition = pageKeys.length;

  // local toggle (0 = default, 1 = flipped)
  const [preset, setSelectedPreset] = useState(selectedTalentPreset);
  const [activeTab, setActiveTab] = useState(0);
  const [specialsTab, setSpecialTabs] = useState(0);
  const isStarTab = activeTab === STAR_TAB_INDEX;

  const isUsingPreset =
    (selectedTalentPreset === 0 && preset !== 0) ||
    (selectedTalentPreset === 1 && preset === 0);

  const presetTalents = isUsingPreset ? talentPreset?.talents : talents;
  const presetStarTalents = isUsingPreset ? talentPreset?.starTalents : starTalents;
  const starOrdered = presetStarTalents?.orderedTalents ?? [];
  const activeTalents = isStarTab
    ? { ...presetStarTalents, orderedTalents: getStarTalentPage(starOrdered.length ? fillMissingTalents(starOrdered) : [], specialsTab) }
    : presetTalents?.[activeTab];

  const changeTab = (index) => {
    setActiveTab(index === starPosition ? STAR_TAB_INDEX : index);
    setSpecialTabs(0);
  };

  const spentTalentPoints = pointsSpent(activeTalents?.orderedTalents);

  const selectedAddedLevels = isUsingPreset
    ? talentPreset?.addedLevels
    : addedLevels;

  const selectedAddedLevelsBreakdown = isUsingPreset
    ? talentPreset?.addedLevelsBreakdown
    : addedLevelsBreakdown;

  // game: AllTalentLV caps the added levels it hands a Royal Guardian talent at the Talent
  // Reattainment armory upgrade, so this tab shows what its talents actually receive.
  const isRoyalGuardianTab = activeTalents?.orderedTalents?.some(({ skillIndex }) => isRoyalGuardianTalent(skillIndex));
  const rgAddedLevelsCap = getArmoryUpgradeBonus(account, ARMORY_TALENT_REATTAINMENT);
  const effectiveAddedLevels = isRoyalGuardianTab
    ? Math.min(selectedAddedLevels ?? 0, rgAddedLevelsCap)
    : selectedAddedLevels;
  const effectiveAddedLevelsBreakdown = effectiveAddedLevels !== selectedAddedLevels
    ? createBreakdown(selectedAddedLevelsBreakdown?.statName ?? 'Added levels', effectiveAddedLevels, [
      ...(selectedAddedLevelsBreakdown?.tree ?? []),
      flat('Talent Reattainment cap', effectiveAddedLevels - (selectedAddedLevels ?? 0),
        { note: 'Royal Guardian talents get no more than the armory upgrade allows' })
    ], { combine: 'sum' })
    : selectedAddedLevelsBreakdown;

  const addedText = formatNum(effectiveAddedLevels ?? 0);

  return <Panel title={'Talents'} meta={isStarTab ? `Specials ${specialsTab + 1}` : cleanUnderscore(talents?.[activeTab]?.name)}>
    <Box sx={CONTROLS_SX}>
      <ViewSwitch
        label={'Talent preset'}
        value={preset}
        onChange={setSelectedPreset}
        sx={PRESET_SX}
        options={[0, 1].map((index) => [index, <span key={index}>
          Preset {index + 1}{selectedTalentPreset === index ? <InUseDot/> : null}
        </span>])}
      />
      <Tabber
        level={2}
        disableQuery
        iconsOnly
        label={'Talent pages'}
        tabs={[...pageKeys.map((key) => cleanUnderscore(talents?.[key]?.name)), 'Star talents']}
        icons={[...pageKeys.map((key) => `data/ClassIcons${talents?.[key]?.id}`), 'data/ClassIcons0']}
        activeTab={isStarTab ? starPosition : activeTab}
        onTabChange={changeTab}
      />
    </Box>
    <Box sx={POINTS_SX}>
      <Panel.KV label={'Points spent'} value={formatNum(spentTalentPoints ?? 0)}/>
      <Panel.KV label={'Added levels'} value={effectiveAddedLevelsBreakdown
        ? <Breakdown asValue title={'Added levels'} valueNotation={'Big'} data={{ ...effectiveAddedLevelsBreakdown, totalValue: addedText }}>{addedText}</Breakdown>
        : addedText}/>
    </Box>
    <CardGrid size={'icon'} sheetColumns={[5]}>
      {activeTalents?.orderedTalents?.slice(0, 15).map((talentDetails, index) => {
        const { talentId, level, baseLevel, maxLevel, name, isSuperTalent } = talentDetails;
        const slotKey = `${talentId}-${index}`;
        if (talentId === 'arrow') {
          return index === STAR_ARROW_SLOTS[0]
            ? <ArrowSlot key={slotKey} label={'Previous specials'} src={'data/UIAnvilArrowsG2.png'}
                         onClick={specialsTab > 0 ? () => setSpecialTabs(specialsTab - 1) : null}/>
            : <ArrowSlot key={slotKey} label={'Next specials'} src={'data/UIAnvilArrowsG1.png'}
                         onClick={specialsTab < STAR_PAGES - 1 ? () => setSpecialTabs(specialsTab + 1) : null}/>;
        }
        // A blank is the game's lock: nothing to read, so no note and no tab stop
        if (talentId === 'Blank' || talentId === '84' || !name) return <IconTile key={slotKey} icon={LOCK} alt={''}/>;
        const isActiveTalent = Object.hasOwn(talentDetails, 'manaCost') && Object.hasOwn(talentDetails, 'cooldown');
        const isMaxed = !isStarTab && baseLevel >= maxLevel;
        const libraryCanRaise = isMaxed && isBookEligibleTalent(talentId) && maxLevel < maxBookLv;
        // A super talent wears the game's border over its sprite, as in game: behind it, the sprite hid it
        return <IconTile key={slotKey} icon={`data/UISkillIcon${talentId}.png`} alt={cleanUnderscore(name)} iconSize={TALENT_ICON}
                         frame={isSuperTalent ? `etc/Super_Talent_${isActiveTalent ? 'Active' : 'Passive'}_Border.png` : undefined}
                         frameAbove
                         // A talent the save has no max for (the parser's -1: nothing unlocked yet) reads 0 / 0: blank, it
                         // looked broken
                         value={formatNum(Math.max(level ?? 0, 0), 'whole')}
                         sub={`/ ${formatNum(Math.max(maxLevel ?? 0, 0), 'whole')}`}
                         badge={libraryCanRaise ? 'up' : undefined}
                         details={<Stack gap={0.5}>
                           <TalentTooltip {...talentDetails}/>
                           {libraryCanRaise ? <StatusText status={'up'} wrap>The Library can still raise it</StatusText>
                             : isMaxed ? <StatusText status={'maxed'} wrap>Maxed</StatusText> : null}
                         </Stack>}/>;
      })}
    </CardGrid>
  </Panel>;
};

export default Talents;
