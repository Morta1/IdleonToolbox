import React, { useEffect, useState } from 'react';
import debounce from 'lodash.debounce';
import { Card, CardContent, InputBase, Stack, TextField, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import { cleanUnderscore, growth, prefix } from '@utility/helpers';
import styled from '@emotion/styled';

const BuildTab = ({ note, talents: talentList = [], createMode, onCustomBuildChange, tabIndex }) => {
  const [localTalents, setLocalTalents] = useState([]);

  useEffect(() => {
    setLocalTalents(!createMode ? talentList : talentList?.map((talent) => ({
      ...talent,
      level: 0
    })))
  }, [createMode]);

  const handleChange = debounce(({ target }, index) => {
    const val = target?.value;
    let tempTalents, tempNote;
    if (target?.name === 'level') {
      tempTalents = localTalents?.map((talent, ind) => ind === index ? {
        ...talent,
        level: val ? val : 0
      } : talent);
      setLocalTalents(tempTalents);
    }
    if (target?.name === 'note') {
      tempNote = val
    }
    typeof onCustomBuildChange === 'function' && onCustomBuildChange({
      tabIndex,
      tabTalents: tempTalents,
      tabNote: tempNote
    });
  }, 200);

  return <>
    <Stack gap={1} direction={'row'} flexWrap={'wrap'} sx={{ width: 320, minHeight: 255.95 }}>
      {localTalents.map((skill, index) => {
        const { name, skillIndex, level } = skill;
        return <Stack alignItems={'center'} key={skillIndex} sx={{ width: 56, height: 56 }}>
          <Tooltip
            title={<TalentTooltip name={name} level={level} skill={skill}/>}>
            <img style={{ opacity: createMode ? 1 : level === 0 ? .3 : 1 }}
                 src={`${prefix}data/UISkillIcon${skillIndex}.png`} alt="skill-icon"/>
          </Tooltip>
          {createMode ? <CustomInput name={'level'} onChange={(e) => handleChange(e, index)}/> :
            <Typography variant={'body1'}>{level || <span>&nbsp;</span>}</Typography>}
        </Stack>
      })}
    </Stack>
    <Card sx={{ width: 320, my: 2 }}>
      <CardContent>
        {createMode ? <CustomMultiline name={'note'} minRows={2} multiline placeholder={`Tab ${tabIndex} note`}
                                       onChange={(e) => handleChange(e)}/> :
          <Typography>{note}</Typography>}
      </CardContent>
    </Card>
  </>
};

const TalentTooltip = ({ name, skill, level }) => {
  const { description, funcX, x1, x2, funcY, y1, y2 } = skill;
  const realLevel = isNaN(parseInt(level)) ? 100 : parseInt(level);
  const mainStat = realLevel > 0 ? growth(funcX, realLevel, x1, x2) : 0;
  const secondaryStat = realLevel > 0 ? growth(funcY, realLevel, y1, y2) : 0;
  return <>
    <Typography variant={'h5'}>{cleanUnderscore(name)}</Typography>
    <Typography
      variant={'body1'}>{cleanUnderscore(cleanUnderscore(description).replace('{', mainStat).replace('}', secondaryStat))}</Typography>
  </>
}


const CustomInput = styled(InputBase)`
  & .MuiInputBase-input {
    border: 1px solid #7e7e7e;
    border-radius: 5px;
    padding: 3px;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      /* display: none; <- Crashes Chrome on hover */
      -webkit-appearance: none;
      margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
    }

    &[type=number] {
      -moz-appearance: textfield; /* Firefox */
    }
  }
`;


const CustomMultiline = styled(TextField)`
  & {
    width: 100%;
  }
`;

export default BuildTab;