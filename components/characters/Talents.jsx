import React, { useEffect, useState } from 'react';
import { cleanUnderscore, fillMissingTalents, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Tooltip from '../Tooltip';
import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import { Breakdown, TalentTooltip } from '../common/styles';
import InfoIcon from '@mui/icons-material/Info';


const Talents = ({
                   talents,
                   starTalents,
                   talentPreset,
                   addedLevels,
                   addedLevelsBreakdown,
                   selectedTalentPreset,
                   account
                 }) => {
  const STAR_TAB_INDEX = Object.keys(talents || {}).length === 5 ? 5 : 4;

  // local toggle (0 = default, 1 = flipped)
  const [preset, setSelectedPreset] = useState(selectedTalentPreset);
  const [selectedTab, setSelectedTab] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [activeTalents, setActiveTalents] = useState();
  const [specialsTab, setSpecialTabs] = useState(0);

  const spentTalentPoints = activeTalents?.orderedTalents?.reduce(
    (res, { level = 0 }) => res + level,
    0
  );

  // ✅ single boolean flag to decide which set to use
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
                    icon={<TabIcon src={`${prefix}data/ClassIcons${talents?.[tabIndex]?.id}.png`} alt={tabName}/>}
                    aria-label={`${tabName}-tab`}
                    onClick={() => setActiveTab(parseInt(tabIndex))}
                    key={`${tabName}-${tabIndex}`}/>
      })}
      <Tab sx={{ minWidth: { xs: 'unset', sm: 'inherit' } }}
           onClick={() => setActiveTab(STAR_TAB_INDEX)}
           aria-label={`star-sign-tab`}
           icon={<TabIcon src={`${prefix}data/ClassIcons0.png`} alt=""/>}/>
    </Tabs>
    {activeTab === STAR_TAB_INDEX ? <Typography variant={'caption'} mt={2} style={{
        opacity: activeTab === 4
          ? 1
          : 0
      }}>Specials {specialsTab + 1}</Typography> :
      <Typography variant={'caption'} mt={2}>{cleanUnderscore(talents?.[activeTab]?.name)}</Typography>}
    <Typography component={'div'} variant={'caption'}>Total Points Spent: {spentTalentPoints}</Typography>
    <Stack gap={1} direction={'row'} justifyContent={'center'} alignItems={'center'}>
      <Typography component={'div'} variant={'caption'}>Added levels: {selectedAddedLevels}</Typography>
      <Tooltip title={<Breakdown titleStyle={{ width: 150 }} breakdown={selectedAddedLevelsBreakdown}/>}>
        <InfoIcon/>
      </Tooltip>
    </Stack>
    <div className="talents-wrapper">
      {activeTalents?.orderedTalents?.map((talentDetails, index) => {
        const { talentId, level, baseLevel, maxLevel, name } = talentDetails;
        if (index >= 15) return null;
        const hardMaxed = activeTab === STAR_TAB_INDEX ? true : baseLevel < maxLevel;
        const levelText = getLevelAndMaxLevel(level, maxLevel);

        return (talentId === 'Blank' || talentId === '84' || talentId === 'arrow') ?
          <div key={talentId + '' + index} className={`blank ${(index === 10 || index === 14) && 'arrow'}`}>
            {(index !== 10 && index !== 14) && <TalentIcon src={`${prefix}data/UISkillIconLocke.png`} alt=""/>}
            {index === 10 && specialsTab > 0 ?
              <div>
                <TalentIcon onClick={() => switchSpecials(specialsTab - 1)} className={'arrow'}
                            src={`${prefix}data/UIAnvilArrowsG2.png`}
                            arrow
                            alt=""/>
              </div> : null}
            {(index === 14 || index === 26) && specialsTab < 4 ?
              <div>
                <TalentIcon onClick={() => switchSpecials(specialsTab + 1)} className={'arrow'}
                            src={`${prefix}data/UIAnvilArrowsG1.png`}
                            arrow
                            alt=""/>
              </div> : null}
          </div> :
          <Tooltip key={talentId + '' + index} title={talentId >= 0 ? <TalentTooltip {...talentDetails}/> : ''}>
            <div className={'talent-wrapper'}>
              {!name ? <TalentIcon src={`${prefix}data/UISkillIconLocke.png`} alt=""/> : <TalentIcon
                src={`${prefix}data/UISkillIcon${talentId}.png`} alt=""/>}
              <Typography fontSize={12} sx={{
                ...(!hardMaxed ? {
                  fontWeight: 500,
                  textShadow: '0px 0px 15px #fd5f2f',
                  color: '#fd5f2f'
                } : {})
              }}>
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
    <img src={src} alt=""/>
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
