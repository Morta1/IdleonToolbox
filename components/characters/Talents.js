import React, { useEffect, useState } from "react";
import { prefix } from "utility/helpers";
import styled from "@emotion/styled";
import Tooltip from "../Tooltip";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { TalentTooltip } from "../common/styles";

const Talents = ({ talents, starTalents }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [activeTalents, setActiveTalents] = useState();
  const [specialsTab, setSpecialTabs] = useState(1);

  useEffect(() => {
    const tempTalents = activeTab === 4 ? handleStarTalents(starTalents, specialsTab) : talents[activeTab];
    setActiveTalents(tempTalents);
    setSpecialTabs(1);
  }, [activeTab]);

  const switchSpecials = (tab) => {
    setSpecialTabs(tab);
    setActiveTalents(handleStarTalents(starTalents, tab));
  }

  const handleStarTalents = (tab, tabIndex) => {
    const clonedTalents = JSON.parse(JSON.stringify(tab?.orderedTalents));
    let tempTalents = tabIndex === 1 ? clonedTalents?.slice(0, 13) : tabIndex === 2 ? clonedTalents?.slice(13, 26) : clonedTalents?.slice(26, clonedTalents.length);
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
    if ((!level || level === -1) || (!maxLevel || maxLevel === -1)) {
      return '';
    }
    return `${level}/${maxLevel}`;
  }

  return <StyledTalents active={activeTab}>
    <Tabs centered
          value={selectedTab} onChange={(e, selected) => setSelectedTab(selected)}>
      {Object.keys(talents)?.map((tabIndex) => {
        const tabName = talents?.[tabIndex]?.name;
        return <Tab sx={{ minWidth: { xs: 'unset', sm: 'inherit' } }}
                    icon={<TabIcon src={`${prefix}data/ClassIcons${talents?.[tabIndex]?.id}.png`}/>}
                    onClick={() => setActiveTab(parseInt(tabIndex))}
                    key={`${tabName}-${tabIndex}`}/>
      })}
      <Tab sx={{ minWidth: { xs: 'unset', sm: 'inherit' } }} onClick={() => setActiveTab(4)}
           icon={<TabIcon src={`${prefix}data/ClassIcons0.png`} alt=""/>}/>
    </Tabs>
    <div className="talents-wrapper">
      {activeTalents?.orderedTalents?.map((talentDetails, index) => {
        const { talentId, level, maxLevel } = talentDetails;
        if (index >= 15) return null;
        const levelText = getLevelAndMaxLevel(level, maxLevel);
        return (talentId === 'Blank' || talentId === '84' || talentId === 'arrow') ?
          <div key={talentId + '' + index} className={`blank ${(index === 10 || index === 14) && 'arrow'}`}>
            {(index !== 10 && index !== 14) && <TalentIcon src={`${prefix}data/UISkillIconLocke.png`} alt=""/>}
            {index === 10 && specialsTab > 1 ?
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
          <Tooltip key={talentId + '' + index} title={<TalentTooltip {...talentDetails}/>}>
            <div className={'talent-wrapper'}>
              {!isNaN(talentId) ? <TalentIcon src={`${prefix}data/UISkillIcon${talentId}.png`} alt=""/> :
                <TalentIcon src={`${prefix}data/UISkillIconLocke.png`} alt=""/>}
              <Typography fontSize={12}>{levelText}&nbsp;</Typography>
            </div>
          </Tooltip>;
      })}
    </div>
    <div className="star-talents-arrows">
      <span style={{ opacity: activeTab === 4 ? 1 : 0 }}>Specials {specialsTab}</span>
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
    margin-top: 25px;
    display: grid;
    min-height: 245px;
    grid-template-columns: repeat(5, 50px);
    //column-gap: 10px;
    row-gap: 10px;
    justify-content: center;
    margin-bottom: 10px;
  }
`;

export default Talents;
