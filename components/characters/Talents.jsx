import React, { useEffect, useState } from 'react';
import { cleanUnderscore, fillMissingTalents, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Tooltip from '../Tooltip';
import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import { TalentTooltip } from '../common/styles';
import { Breakdown } from '../common/Breakdown/Breakdown';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { isBookEligibleTalent, isRoyalGuardianTalent } from '@parsers/talents';
import { ARMORY_TALENT_REATTAINMENT, getArmoryUpgradeBonus } from '@parsers/class-specific/royalGuardian';


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

  // local toggle (0 = default, 1 = flipped)
  const [preset, setSelectedPreset] = useState(selectedTalentPreset);
  const [selectedTab, setSelectedTab] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [activeTalents, setActiveTalents] = useState();
  const [specialsTab, setSpecialTabs] = useState(0);

  // `level` carries the added levels on top of the points actually invested, so summing it counts
  // the account-wide bonus once per talent. Star talents never take added levels and carry no
  // baseLevel, so they fall back to level.
  const spentTalentPoints = activeTalents?.orderedTalents?.reduce(
    (res, { level = 0, baseLevel }) => res + (baseLevel ?? level),
    0
  );

  const isUsingPreset =
    (selectedTalentPreset === 0 && preset !== 0) ||
    (selectedTalentPreset === 1 && preset === 0);

  const getPreset = (specialTab = 0) => {
    const presetTalents = isUsingPreset ? talentPreset?.talents : talents;
    const presetStarTalents = isUsingPreset ? talentPreset?.starTalents : starTalents;

    return activeTab === STAR_TAB_INDEX
      ? handleStarTalents(presetStarTalents, specialTab)
      : presetTalents?.[activeTab];
  };

  useEffect(() => {
    const currentTalentsDisplay = getPreset(specialsTab);
    setActiveTalents(currentTalentsDisplay);
    if (activeTab !== STAR_TAB_INDEX) {
      setSpecialTabs(0);
    }
  }, [activeTab, talents, preset, specialsTab]);

  const switchSpecials = (tab) => {
    setSpecialTabs(tab);
    setActiveTalents(getPreset(tab));
  };

  const getStarTalentPage = (talents, index) =>
    talents?.slice(index * 13, (index + 1) * 13);

  const handleStarTalents = (tab, tabIndex) => {
    const clonedTalents = structuredClone(tab?.orderedTalents);
    const filledTalents = fillMissingTalents(clonedTalents);
    let tempTalents = getStarTalentPage(filledTalents, tabIndex);

    if (tempTalents.length < 13) {
      tempTalents = new Array(13).fill(1).map((_, ind) => tempTalents[ind] ?? {});
    }

    tempTalents.splice(10, 0, { talentId: 'arrow' });
    tempTalents.splice(14, 0, { talentId: 'arrow' });

    return {
      ...tab,
      orderedTalents: tempTalents,
    };
  };

  const getLevelAndMaxLevel = (level, maxLevel) =>
    level >= 0 && maxLevel >= 0 ? `${level}/${maxLevel}` : '';

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
    ? {
      ...selectedAddedLevelsBreakdown,
      totalValue: effectiveAddedLevels,
      categories: [
        ...(selectedAddedLevelsBreakdown?.categories ?? []),
        {
          name: 'Royal Guardian',
          sources: [{ name: 'Talent Reattainment cap', value: effectiveAddedLevels - (selectedAddedLevels ?? 0) }]
        }
      ]
    }
    : selectedAddedLevelsBreakdown;

  return <StyledTalents active={activeTab}>
    <Tabs centered value={preset} onChange={(e, selected) => setSelectedPreset(selected)}>
      <Tab sx={{ minWidth: { xs: 'unset', sm: 'inherit' } }}
        aria-label={`star-sign-tab`}
        label={<span style={{ textShadow: selectedTalentPreset === 0 ? 'cyan 1px 0 10px' : '' }}>Preset 1</span>}
        value={0}
      />
      <Tab sx={{ minWidth: { xs: 'unset', sm: 'inherit' } }}
        aria-label={`star-sign-tab`}
        label={<span style={{ textShadow: selectedTalentPreset === 1 ? 'cyan 1px 0 10px' : '' }}>Preset 2</span>}
        value={1}
      />
    </Tabs>
    <Tabs centered
      value={selectedTab} onChange={(e, selected) => setSelectedTab(selected)}>
      {Object.keys(talents || {})?.map((tabIndex) => {
        const tabName = talents?.[tabIndex]?.name;
        return <Tab sx={{ minWidth: { xs: 'unset', sm: 'inherit' } }}
          icon={<TabIcon src={`${prefix}data/ClassIcons${talents?.[tabIndex]?.id}.png`} alt={tabName} />}
          aria-label={`${tabName}-tab`}
          onClick={() => setActiveTab(parseInt(tabIndex))}
          key={`${tabName}-${tabIndex}`} />
      })}
      <Tab sx={{ minWidth: { xs: 'unset', sm: 'inherit' } }}
        onClick={() => setActiveTab(STAR_TAB_INDEX)}
        aria-label={`star-sign-tab`}
        icon={<TabIcon src={`${prefix}data/ClassIcons0.png`} alt="Class Icons0" />} />
    </Tabs>
    {activeTab === STAR_TAB_INDEX ? <Typography variant={'caption'} mt={2} style={{
      opacity: activeTab === 4
        ? 1
        : 0
    }}>Specials {specialsTab + 1}</Typography> :
      <Typography variant={'caption'} mt={2}>{cleanUnderscore(talents?.[activeTab]?.name)}</Typography>}
    <Typography component={'div'} variant={'caption'}>Total Points Spent: {spentTalentPoints}</Typography>
    <Stack gap={1} direction={'row'} justifyContent={'center'} alignItems={'center'}>
      <Typography component={'div'} variant={'caption'}>Added levels: {effectiveAddedLevels}</Typography>
      <Breakdown data={effectiveAddedLevelsBreakdown} valueNotation="Big" >
        <Stack alignContent={'center'}>
          <IconInfoCircleFilled size={18} />
        </Stack>
      </Breakdown>
    </Stack>
    <Stack gap={1} direction={'row'} justifyContent={'center'} alignItems={'center'}>
      <Typography component={'div'} variant={'caption'}>Level color legend</Typography>
      <Tooltip title={
        <Stack gap={0.5}>
          <Typography variant={'caption'}>White: not maxed yet, points still available</Typography>
          <Typography variant={'caption'} sx={{ color: '#5fc9fd' }}>Blue: maxed, Library can still raise it</Typography>
          <Typography variant={'caption'} sx={{ color: '#fd5f2f' }}>Orange: maxed, Library can't raise it further</Typography>
        </Stack>
      }>
        <Stack alignContent={'center'}>
          <IconInfoCircleFilled size={18} />
        </Stack>
      </Tooltip>
    </Stack>
    <div className="talents-wrapper">
      {activeTalents?.orderedTalents?.map((talentDetails, index) => {
        const { talentId, level, baseLevel, maxLevel, name, isSuperTalent } = talentDetails;
        if (index >= 15) return null;
        const isActiveTalent = talentDetails.hasOwnProperty('manaCost') && talentDetails.hasOwnProperty('cooldown');
        const isStarTab = activeTab === STAR_TAB_INDEX;
        const isMaxed = isStarTab ? true : baseLevel >= maxLevel;
        const isBookEligible = !isStarTab && isBookEligibleTalent(talentId);
        const pendingLibraryBooks = isMaxed && isBookEligible && maxLevel < maxBookLv;
        const levelText = getLevelAndMaxLevel(level, maxLevel);
        const levelTextSx = isStarTab || !isMaxed
          ? {}
          : pendingLibraryBooks
            ? { fontWeight: 500, textShadow: '0px 0px 15px #5fc9fd', color: '#5fc9fd' }
            : { fontWeight: 500, textShadow: '0px 0px 15px #fd5f2f', color: '#fd5f2f' };

        return (talentId === 'Blank' || talentId === '84' || talentId === 'arrow') ?
          <div key={talentId + '' + index} className={`blank ${(index === 10 || index === 14) && 'arrow'}`}>
            {(index !== 10 && index !== 14) && <TalentIcon src={`${prefix}data/UISkillIconLocke.png`} alt="UISkill Icon Locke" />}
            {index === 10 && specialsTab > 0 ?
              <div>
                <TalentIcon onClick={() => switchSpecials(specialsTab - 1)} className={'arrow'}
                  src={`${prefix}data/UIAnvilArrowsG2.png`}
                  arrow
                  alt="" />
              </div> : null}
            {(index === 14 || index === 26) && specialsTab < 4 ?
              <div>
                <TalentIcon onClick={() => switchSpecials(specialsTab + 1)} className={'arrow'}
                  src={`${prefix}data/UIAnvilArrowsG1.png`}
                  arrow
                  alt="" />
              </div> : null}
          </div> :
          <Tooltip key={talentId + '' + index} title={talentId >= 0 ? <TalentTooltip {...talentDetails} /> : ''}>
            <div className={'talent-wrapper'}>
              {isSuperTalent && <TalentIcon style={{ position: 'absolute' }} src={`${prefix}etc/Super_Talent_${isActiveTalent ? 'Active' : 'Passive'}_Border.png`} alt={isActiveTalent ? 'Active' : 'Passive'} />}
              {!name ? <TalentIcon src={`${prefix}data/UISkillIconLocke.png`} alt="UISkill Icon Locke" /> : <TalentIcon
                src={`${prefix}data/UISkillIcon${talentId}.png`} alt="" />}
              <Typography fontSize={12} sx={levelTextSx}>
                {levelText}
              </Typography>
            </div>
          </Tooltip>;
      })}
    </div>
  </StyledTalents>
};

const TabIcon = ({ src }) => {
  return <Box sx={{ width: { xs: 30 }, '> img': { width: { xs: 30 } } }}>
    <img src={src} alt="" />
  </Box>
}
const TalentIcon = styled.img`
  width: 50px;
  height: 50px;
  margin-bottom: ${({ arrow }) => arrow ? '20px' : 0};
`;

const StyledTalents = styled.div`
  text-align: center;

  .tabs {
    position: relative;
    display: grid;
    margin-top: 10px;
    grid-template-columns: repeat(auto-fill, 50px);
    grid-template-rows: 50px;
    justify-content: center;

    .active {
      filter: brightness(1);
    }

    .star {
      position: absolute;
      right: 0;
    }

    > img {
      cursor: pointer;
      filter: brightness(0.4);

      &:last-child {
        justify-self: flex-end;
      }
    }
  }

  .star-talents-arrows {
    height: 80%;
  }

  .arrow {
    cursor: pointer;
    align-self: center;
  }


  .talents-wrapper {
    position: relative;
    margin-top: 18px;
    display: grid;
    min-height: 245px;
    grid-template-columns: repeat(5, 50px);
    row-gap: 10px;
    column-gap: 5px;
    justify-content: center;
    margin-bottom: 10px;
  }
`;

export default Talents;
