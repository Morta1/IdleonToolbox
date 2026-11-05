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

const LOCK = 'data/UISkillIconLocke.png';
// A star talent page's 13 talents, with its two arrows in their slots
const STAR_PAGE_SIZE = 13;
const STAR_PAGES = 5;
const STAR_ARROW_SLOTS = [10, 14];
// A pair never breaks in its tile: five tiles share a phone's column, so there its spaces close up
const PAIR_SX = { whiteSpace: 'nowrap', wordSpacing: { xs: '-0.2em', sm: 0 } };

const getStarTalentPage = (talents, index) => {
  const page = talents.slice(index * STAR_PAGE_SIZE, (index + 1) * STAR_PAGE_SIZE);
  const full = Array.from({ length: STAR_PAGE_SIZE }, (_, slot) => page[slot] ?? {});
  return STAR_ARROW_SLOTS.reduce((slots, slot) => slots.toSpliced(slot, 0, { talentId: 'arrow' }), full);
};

// The game's arrow, in its slot on the star pages
const ArrowSlot = ({ label, src, onClick }) => <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 72 }}>
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

  // `level` carries the added levels on top of the points actually invested, so summing it counts
  // the account-wide bonus once per talent. Star talents never take added levels and carry no
  // baseLevel, so they fall back to level.
  const spentTalentPoints = activeTalents?.orderedTalents?.reduce(
    (res, { level = 0, baseLevel }) => res + (baseLevel ?? level),
    0
  );

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
    <Stack gap={1}>
      <ViewSwitch
        label={'Talent preset'}
        value={preset}
        onChange={setSelectedPreset}
        sx={{ alignSelf: 'flex-start' }}
        // The game's active preset glows, as it did on the old tabs.
        options={[0, 1].map((index) => [index, <span key={index} style={{ textShadow: selectedTalentPreset === index ? 'cyan 1px 0 10px' : '' }}>
          Preset {index + 1}
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
    </Stack>
    <Box>
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
        return <IconTile key={slotKey} icon={`data/UISkillIcon${talentId}.png`} alt={cleanUnderscore(name)}
                         frame={isSuperTalent ? `etc/Super_Talent_${isActiveTalent ? 'Active' : 'Passive'}_Border.png` : undefined}
                         value={level >= 0 && maxLevel >= 0 ? <Box component={'span'} sx={PAIR_SX}>{`${level} / ${maxLevel}`}</Box> : undefined}
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
