import { notateNumber, prefix } from '../../utility/helpers';
import { capitalize, Card, CardContent, Typography, Box, Stack, TextField, Button} from '@mui/material';
import Tooltip from 'components/Tooltip';
import React, { useContext, useState } from 'react';
import ProgressBar from 'components/common/ProgressBar';
import { AppContext } from 'components/common/context/AppProvider';
import Tabber from 'components/common/Tabber';
import ItemDisplay from 'components/common/ItemDisplay';
import styled from '@emotion/styled';
import { crafts, itemsArray } from 'data/website-data';

const Skills = () => {
  const { state } = useContext(AppContext);
  const [selectedTab, setSelectedTab] = useState(0);

  const [desiredToolLevel, setDesiredToolLevel] = useState(0);
  const handleDesiredToolLevelChange = (e) => {
    const { value } = e.target;
    setDesiredToolLevel(parseInt(value));
  };

  var names = state?.characters?.map((character) => {return character.name});
  var selectedChar = state?.characters?.filter((character, index) => {return index == selectedTab})[0];
  return <Tabber tabs={names} onTabChange={(selected) => setSelectedTab(selected)}>
        <SkillInfo character={selectedChar}></SkillInfo>
        <Box sx={{
          display: 'inline-flex',
          mt: '1em'
        }}>
          <Box>
            <Typography variant={'h5'}>Current</Typography>
            <EquipmentPage character={selectedChar} account={state?.account} items={selectedChar.tools} blank={8}></EquipmentPage>
          </Box>
          <Box>
            <Typography variant={'h5'}>Best</Typography>
            <EquipmentPage character={selectedChar} account={state?.account} items={selectedChar.tools} blank={8} best={true}></EquipmentPage>
          </Box>
          <Box>
            <Typography variant={'h5'}>Desired</Typography>
            <EquipmentPage character={selectedChar} account={state?.account} items={selectedChar.tools} blank={8} best={desiredToolLevel}></EquipmentPage>
            <TextField type={'number'}
              sx={{ width: 90, mt: '1em' }}
              defaultValue={desiredToolLevel}
              onChange={(e) => handleDesiredToolLevelChange(e)}
              label={'Goal'} variant={'outlined'} inputProps={{ min: 0 }}/>
              <Box sx={{display: 'inline-grid'}}>
                <Button onClick={() => onAddItemToPlanner(1)}>Add to item planner</Button>
                <Button onClick={() => onAddItemToPlanner(state?.characters?.length)}>Add to item planner for all characters</Button>
              </Box>
          </Box>
        </Box>
    </Tabber>
};

const SkillInfo = ({character}) => {
    let showSkillsRankOneOnly = false
    let skills = character.skillsInfo;
    let charName = character.name;
    return <Card>
      <CardContent>
        <Box sx={{
          display: 'grid',
          gridAutoFlow: 'column',
          gap: showSkillsRankOneOnly ? '24px' : 'none',
          gridTemplateColumns: { xs: showSkillsRankOneOnly ? 'fit-content' : `repeat(5, minmax(45px, 100px))` },
          gridTemplateRows: showSkillsRankOneOnly ? null : { xs: 'repeat(3, minmax(45px, 100px))' },
          justifyContent: 'center'
        }}>

          {Object.keys(skills || {})?.map((skillName, index) => {
            const { level, rank, icon } = skills[skillName];
            if (skillName === 'character' || (showSkillsRankOneOnly && rank !== 1)) return null;
            return <Box key={index}>
              <Tooltip title={<SkillTooltip {...skills?.[skillName]} skillName={skillName} charName={charName}/>}>
                <img src={`${prefix}data/${icon}.png`} style={{ width: 38, height: 36 }} alt=""/>
              </Tooltip>
              <Typography>Lv {level}</Typography>
            </Box>
          })}
        </Box>
      </CardContent>
    </Card>
}

const SkillTooltip = ({ exp, expReq, charName, skillName, level }) => {
    const percent = exp / expReq * 100;
    return <>
      <Typography variant={'h5'} fontWeight={'bold'}>{charName}</Typography>
      <Typography variant={'body1'}>{capitalize(skillName)} <Typography
        variant={'body1'}
        component={'span'}>(Lv. {level})</Typography></Typography>
      <ProgressBar percent={percent} bgColor={'#f3dd4c'}/>
      <Typography variant={'body1'}>{notateNumber(exp, 'Big')} / {notateNumber(expReq, 'Big')} <Typography
        variant={'body1'}
        component={'span'}>({Math.round(percent)}%)</Typography>
      </Typography>
    </>
  }
  
  const EquipmentPage = ({ items, character, account, blank, best }) => {
    var toolTypes = [{ type: 'PICKAXE', skill: character.skillsInfo.mining},
      { type: 'HATCHET',skill: character.skillsInfo.chopping },
      { type: 'FISHING_ROD', skill: character.skillsInfo.fishing },
      { type: 'BUG_CATCHING_NET', skill: character.skillsInfo.catching },
      { type: 'TRAP_BOX_SET', skill: character.skillsInfo.trapping },
      { type: 'WORSHIP_SKULL', skill: character.skillsInfo.worship },
      { type: 'DNA_SPLICER', skill: character.skillsInfo.breeding },
      { type: undefined, skill: undefined}
    ];
    var allTools = itemsArray.filter(i => toolTypes.map(t => t.type).includes(i.Type));
    if(best)
    {
      items = toolTypes.map(toolType => {
        var lvlToConsider = typeof best == 'number' ? best : toolType?.skill?.level;
        return allTools
          .filter(tool => tool.Type == toolType.type && tool.lvReqToEquip <= lvlToConsider)
          .sort((e1, e2) => e1.Weapon_Power - e2.Weapon_Power)
          .slice(-1)[0] 
          ?? { rawName: 'Blank' }
      });
    }
    return <Box
      sx={{
        display: 'grid',
        justifyContent: 'left',
        gridTemplateColumns: 'repeat(2, 60px)',
        mt: '1em',
        mr: '1em'
      }}>
      {items?.map((item, itemIndex) => {
        const { rawName, displayName, amount } = item;
        var name = rawName;
        if(blank == 17)
        {
          name = rawName == 'Blank' ? 'EquipmentTransparent' + 17 : rawName;
        }
        else
        {
          name = rawName == 'Blank' ? 'EquipmentTransparent' + (blank + itemIndex + 1) : rawName;
        }
        return itemIndex < 8 ?
          <Card sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 76 }}
                variant={'outlined'} key={`${rawName}-${itemIndex}`}>
            <CardContent sx={{ '&:last-child': { padding: 0 } }}>
              <Stack alignItems={'center'} justifyContent={'center'}>
                <Tooltip
                  title={displayName && displayName !== 'ERROR' ? <ItemDisplay {...item} character={character}
                                                                               account={account}/> : ''}>
                  <ItemIcon src={`${prefix}data/${name}.png`} alt={name}/>
                </Tooltip>
                {displayName !== 'ERROR' ? amount : ' '}
              </Stack>
            </CardContent>
          </Card> : null;
      })}
    </Box>
  }

  const ItemIcon = styled.img`
  width: 50px;
  height: 50px;
  object-fit: contain;
  `

export default Skills;
