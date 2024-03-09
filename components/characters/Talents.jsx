import React, { useEffect, useState } from 'react';
import { fillMissingTalents, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Tooltip from '../Tooltip';
import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import { Breakdown, TalentTooltip } from '../common/styles';
import InfoIcon from '@mui/icons-material/Info';

const Talents = ({ talents, starTalents, talentPreset, addedLevels, addedLevelsBreakdown }) => {
  const [preset, setSelectedPreset] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [activeTalents, setActiveTalents] = useState();
  const [specialsTab, setSpecialTabs] = useState(0);
  const spentTalentPoints = activeTalents?.orderedTalents?.reduce((res, { level = 0 }) => res + level, 0);

  const getPreset = () => {
    const presetTalents = preset === 1 ? talentPreset?.talents : talents;
    const presetStarTalents = preset === 1 ? talentPreset?.starTalents : starTalents;
    return activeTab === 4 ? handleStarTalents(presetStarTalents, specialsTab) : presetTalents?.[activeTab];
  }

  useEffect(() => {
    const currentTalentsDisplay = getPreset();
    setActiveTalents(currentTalentsDisplay);
    setSpecialTabs(0);
  }, [activeTab, talents, preset]);

  const switchSpecials = (tab) => {
    setSpecialTabs(tab);
    setActiveTalents(handleStarTalents(starTalents, tab));
  }
  const getStarTalentPage = (talents, index) => {
    return talents?.slice(index * 13, (index + 1) * 13)
  }

  const handleStarTalents = (tab, tabIndex) => {
    const clonedTalents = JSON.parse(JSON.stringify(tab?.orderedTalents));
    const filledTalents = fillMissingTalents(clonedTalents);
    let tempTalents = getStarTalentPage(filledTalents, tabIndex);
    // fill for a full talent page
    if (tempTalents.length < 13) {
      tempTalents = new Array(13).fill(1).map((_, ind) => tempTalents[ind] ?? {});
    }
    // insert arrows
    tempTalents?.splice(10, 0, { talentId: 'arrow' });
    tempTalents?.splice(14, 0, { talentId: 'arrow' });
    return {
      ...tab,
      orderedTalents: tempTalents
    };
  }

  const getLevelAndMaxLevel = (level, maxLevel) => {
    if (level >= 0 && maxLevel >= 0) {
      return `${level}/${maxLevel}`;
    }
    return ''
  }

  return <StyledTalents active={activeTab}>
    <Tabs centered value={preset} onChange={(e, selected) => setSelectedPreset(selected)}>
      <Tab sx={{ minWidth: { xs: 'unset', sm: 'inherit' } }}
           aria-label={`star-sign-tab`}
           label={'In use'}
           value={0}
      />
      <Tab sx={{ minWidth: { xs: 'unset', sm: 'inherit' } }}
           aria-label={`star-sign-tab`}
           label={'Preset'}
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
           onClick={() => setActiveTab(4)}
           aria-label={`star-sign-tab`}
           icon={<TabIcon src={`${prefix}data/ClassIcons0.png`} alt=""/>}/>
    </Tabs>
    <Typography mt={2} component={'div'} variant={'caption'}>Total Points Spent: {spentTalentPoints}</Typography>
    <Stack gap={1} direction={'row'} justifyContent={'center'} alignItems={'center'}>
      <Typography component={'div'} variant={'caption'}>Added levels: {preset === 0 ? addedLevels : talentPreset?.addedLevels}</Typography>
      <Tooltip title={<Breakdown titleStyle={{ width: 150 }} breakdown={preset === 0 ? addedLevelsBreakdown : talentPreset?.addedLevelsBreakdown}/>}>
        <InfoIcon/>
      </Tooltip>
    </Stack>
    <div className="talents-wrapper">
      {activeTalents?.orderedTalents?.map((talentDetails, index) => {
        const { talentId, level, maxLevel, name } = talentDetails;
        if (index >= 15) return null;
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
          <Tooltip key={talentId + '' + index} title={talentId ? <TalentTooltip {...talentDetails}/> : ''}>
            <div className={'talent-wrapper'}>
              {!name ? <TalentIcon src={`${prefix}data/UISkillIconLocke.png`} alt=""/> : <TalentIcon
                src={`${prefix}data/UISkillIcon${talentId}.png`} alt=""/>}
              <Typography fontSize={12}>{levelText}&nbsp;</Typography>
            </div>
          </Tooltip>;
      })}
    </div>
    <div className="star-talents-arrows">
      <span style={{ opacity: activeTab === 4 ? 1 : 0 }}>Specials {specialsTab + 1}</span>
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
    column-gap: 2px;
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
    justify-content: center;
    margin-bottom: 10px;
  }
`;

export default Talents;
