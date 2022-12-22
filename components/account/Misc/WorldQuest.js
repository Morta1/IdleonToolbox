import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import React from "react";
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Badge, Box, Stack, Typography } from "@mui/material";
import styled from "@emotion/styled";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator
} from "@mui/lab";
import Tooltip from "components/Tooltip";
import CoinDisplay from "components/common/CoinDisplay";
import { cleanUnderscore, getCoinsArray, numberWithCommas, prefix } from "utility/helpers";

const WorldQuest = ({ quests, characters, totalCharacters, worldName }) => {
  const getQuestIndicator = (status) => {
    switch (status) {
      case 1:
        return <CheckCircleIcon style={{ marginLeft: 'auto', fontSize: 24, color: '#23bb23' }}/>;
      case 0:
        return <RadioButtonCheckedIcon alt={''}
                                       style={{ marginLeft: 'auto', width: 24, height: 24, fill: '#ff8d00' }}/>;
      case -1:
        return <RadioButtonUncheckedOutlinedIcon style={{ marginLeft: 'auto', color: '#868484' }}/>;
      default:
        return null;
    }
  }

  return (
    <Box sx={{ width: { xs: 350, sm: 400 } }}>
      <WorldBg src={`${prefix}npcs/${worldName}.png`}
               onError={(e) => {
                 e.target.src = `${prefix}data/Wb5.png`;
                 e.target.style.width = 'auto';
               }}
               alt=""/>
      {quests?.[worldName].map((npc, index) => {
        return <StyledAccordion key={npc?.name + index} TransitionProps={{ unmountOnExit: true }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
            <img width={50} height={50} src={`${prefix}npcs/${npc?.name}.gif`} alt=""/>
            <span className={'npc-name'}>{cleanUnderscore(npc?.name)}</span>
            {getQuestIndicator(npc?.questsStatus)}
          </AccordionSummary>
          <StyledAccordionDetails>
            <Timeline sx={{ m: 0, p: 0 }}>
              {npc?.npcQuests?.map((npcQuest, innerIndex) => {
                const { Name, completed = [], progress = [] } = npcQuest;
                return <TimelineItem key={npc?.name + "" + index + "" + innerIndex}>
                  <TimelineOppositeContent sx={{ display: 'none' }}/>
                  <TimelineSeparator>
                    <Tooltip title={<QuestTooltip {...npcQuest} npcName={npc?.name}/>}>
                      <TimelineDot
                        sx={{ width: 15, height: 15 }}
                        color={completed?.length === totalCharacters ? 'success' : completed?.length === 0 && progress.length === 0 ? 'grey' : 'warning'}/>
                    </Tooltip>
                    {innerIndex < npc?.npcQuests?.length - 1 ? <TimelineConnector/> : null}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography>{cleanUnderscore(Name)}</Typography>
                    {progress?.length > 0 ?
                      <Stack direction={'row'} flexWrap={'wrap'}>
                        <Box
                          icons={1}                                    {...(progress?.length > 0 ? {} : {})}>
                          {progress?.map(({ charIndex, status }) => {
                            return <Badge key={charIndex + '' + innerIndex}
                                          overlap="circular"
                                          title={status === 1 ? 'Completed' : status === -1 ? 'Not started' : 'In progress'}
                                          anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'right',
                                          }}
                                          badgeContent={<StatusIndicator
                                            color={status === 1 ? '#23bb23' : status === -1 ? '#868484' : '#ff8d00'}/>}>
                              <Avatar title={characters?.[charIndex]?.name}
                                      alt=""
                                      src={`${prefix}data/ClassIcons${characters[charIndex]?.classIndex}.png`}/>
                            </Badge>
                          })}
                        </Box>
                      </Stack>
                      : null}
                  </TimelineContent>
                </TimelineItem>
              })}
            </Timeline>

          </StyledAccordionDetails>
        </StyledAccordion>
      })}
    </Box>
  );
};

const QuestTooltip = ({ rewards, itemReq, customArray }) => {
  return <Stack gap={2}>
    {customArray?.length > 0 ? <Stack>
      <Typography variant={'h6'} fontWeight={'bold'}>Requirements</Typography>
      <Stack>
        {customArray?.map(({ desc, value }, index) => {
          return <div key={desc + '' + index}>
            {cleanUnderscore(desc)} {value}
          </div>
        })}
      </Stack>
    </Stack> : null}
    {itemReq?.length > 0 ? <Stack>
      <Typography variant={'h6'} fontWeight={'bold'}>Item Requirements</Typography>
      <Stack direction={'row'} gap={2}>
        {itemReq?.map(({ name, rawName, amount }, index) => {
          return <Stack alignItems={'center'} justifyContent={'center'} key={name + '' + index}>
            <ItemIcon className={'item-img'} src={`${prefix}data/${rawName}.png`} alt=""/>
            <Typography className={'amount'}>{numberWithCommas(amount)}</Typography>
          </Stack>
        })}
      </Stack>
    </Stack> : null}
    {rewards?.length > 0 ? <Stack>
      <Typography variant={'h6'} fontWeight={'bold'}>Rewards</Typography>
      <Stack direction={'row'} alignItems={'center'} gap={2}>
        {rewards?.map(({ name, rawName, amount }, index) => {
          let img;
          if (rawName.includes('Experience')) {
            img = 'XP';
          } else if (rawName.includes('Talent')) {
            img = 'TalentBook1';
          } else if (rawName.includes('Recipes')) {
            img = `SmithingRecipes${rawName[rawName.length - 1]}`;
          } else {
            img = rawName;
          }
          return <div className={'item-wrapper'} title={cleanUnderscore(name)} key={name + '' + index}>
            {rawName !== 'COIN' ? <Stack justifyContent={'center'} alignItems={'center'}>
                <ItemIcon
                  title={cleanUnderscore(name || rawName)}
                  src={`${prefix}data/${img}.png`}
                  alt=""/>
                <Typography className={'amount'}>{numberWithCommas(amount)}</Typography>
              </Stack> :
              <div className={'coins'}>
                <CoinDisplay title={''}
                             noShadow
                             money={getCoinsArray(amount)}/></div>}
          </div>
        })}
      </Stack>
    </Stack> : null}
  </Stack>
}

const ItemIcon = styled.img`
  width: 40px;
  height: 40px;
`

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  background-color: ${({ color }) => color};
  border-radius: 50%;
  border: 1px solid white;
`;

const StyledAccordion = styled(Accordion)`
  & .MuiCollapse-root .MuiList-root:not(:last-child):after {
    content: "";
    position: absolute;
    bottom: -30px;
    left: 20px;
    height: 100%;
    width: 2px;
    background-color: #e6d1d1;
  }

  .MuiAccordionSummary-content {
    display: flex;
    align-items: center;

    .npc-name {
      margin-left: 10px;
    }

    & > img {
      object-fit: contain;
    }
  }
`;

const StyledAccordionDetails = styled(AccordionDetails)`
  && {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .quest-name-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .characters {
    display: flex;
    align-items: center;
  }

  .npc-quests-wrapper {
    .quest-name {
    }
  }
`

const WorldBg = styled.img`
  width: 100%;
  height: 53px;
  object-fit: cover;
  object-position: -20px;
`;

export default WorldQuest;
