import styled from 'styled-components'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { cleanUnderscore, prefix } from "../../Utilities";
import React from "react";
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Badge from '@material-ui/core/Badge';
import RadioButtonUncheckedOutlinedIcon from '@material-ui/icons/RadioButtonUncheckedOutlined';
import QuestInfoTooltip from "../Common/Tooltips/QuestInfoTooltip";

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
    <WorldQuestsStyle>
      <img src={`${prefix}npcs/${worldName}.png`}
           onError={(e) => {
             e.target.src = `${prefix}data/Wb4.png`;
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
            {npc?.npcQuests?.map((npcQuest, innerIndex) => {
              const { Name, completed = [], progress = [] } = npcQuest;
              return <List key={npc?.name + "" + index + "" + innerIndex} component="div" disablePadding>
                <StyledListItem {...(progress?.length > 0 ? {} : {})}
                                style={{ paddingLeft: 10, background: '#424242' }}>
                  <QuestInfoTooltip {...npcQuest} npcName={npc?.name}>
                    <StyledListItemIcon>
                      {completed?.length === totalCharacters ?
                        <CheckCircleIcon style={{ fontSize: 24, color: '#23bb23' }}/> :
                        completed?.length === 0 && progress.length === 0 ?
                          <RadioButtonUncheckedOutlinedIcon style={{ color: '#868484' }}/> :
                          <RadioButtonCheckedIcon alt={''} style={{ width: 24, height: 24, fill: '#ff8d00' }}/>}
                    </StyledListItemIcon>
                  </QuestInfoTooltip>
                  <ListItemText primary={cleanUnderscore(Name)}/>
                </StyledListItem>
                {progress?.length > 0 ?
                  <List component="div" disablePadding>
                    <StyledListItem icons={1} style={{ paddingLeft: 60, background: '#424242' }}
                                    {...(progress?.length > 0 ? {} : {})}>
                      {progress?.map(({ charIndex, status }) => {
                        return <Badge key={charIndex + '' + innerIndex}
                                      overlap="circular"
                                      title={status === 1 ? 'Completed' : status === -1 ? 'Not started' : 'In progress'}
                                      anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                      }}
                                      badgeContent={<StatusIndicator
                                        color={status === 1 ? '#23bb23' : status === -1 ? '#868484' : '#ff8d00'}/>}
                        >
                          <Avatar title={characters?.[charIndex]?.name}
                                  alt=""
                                  src={`${prefix}icons/${characters[charIndex]?.class}_Icon.png`}/>
                        </Badge>
                      })}
                    </StyledListItem>
                  </List>
                  : null}
              </List>
            })}
          </StyledAccordionDetails>
        </StyledAccordion>
      })}
    </WorldQuestsStyle>
  );
};

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  background-color: ${({ color }) => color};
  border-radius: 50%;
  border: 1px solid white;
`;

const StyledListItemIcon = styled(ListItemIcon)`
  && {
    position: relative;
  }
`;

const StyledListItem = styled(ListItem)`
  && {
    padding-top: 0;
    ${({ icons }) => icons ? `display: flex;flex-wrap:wrap;` : ''}
  }
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

  .MuiAccordionSummary-root.Mui-expanded {
    background-color: #353535;
  }

  .MuiCollapse-root .MuiCollapse-entered {
    background-color: #222831;
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

const WorldQuestsStyle = styled.div`
  > img {
    width: 100%;
    height: 53px;
    object-fit: cover;
    object-position: 0;
  }
`;

export default WorldQuest;
