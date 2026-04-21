import React from 'react';
import { Box, Card, CardContent, InputBase, Stack, TextField, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import { cleanUnderscore, growth, prefix } from '@utility/helpers';
import styled from '@emotion/styled';

// Fully controlled: talent values and the note come straight from the parent
// (BuildForm or BuildDetail). No local mirrors, no useEffect resync needed.
//
// `layout` controls how the grid and the tab-note are arranged:
//   'stack'  (default) — grid on top, note card below (view / detail pages)
//   'row'              — grid left, note fills right (create / edit form)
const BuildTab = ({ note, talents: talentList = [], createMode, onCustomBuildChange, tabIndex, layout = 'stack' }) => {
  const talents = talentList || [];
  const noteValue = note || '';

  const handleLevelChange = (e, index) => {
    const val = e.target.value;
    const nextTalents = talents.map((talent, ind) =>
      ind === index ? { ...talent, level: val === '' ? 0 : val } : talent
    );
    onCustomBuildChange?.({ tabIndex, tabTalents: nextTalents });
  };

  const handleNoteChange = (e) => {
    onCustomBuildChange?.({ tabIndex, tabNote: e.target.value });
  };

  const grid = (
    <Stack
      gap={1}
      direction="row"
      flexWrap="wrap"
      sx={{ width: 320, minHeight: 255.95, flexShrink: 0 }}
    >
      {talents.map((skill, index) => {
        const { name, skillIndex, level } = skill;
        return (
          <Stack alignItems="center" key={skillIndex} sx={{ width: 56, height: 56 }}>
            <Tooltip title={<TalentTooltip name={name} level={level} skill={skill}/>}>
              <img
                style={{ opacity: createMode ? 1 : level === 0 ? 0.3 : 1 }}
                src={`${prefix}data/UISkillIcon${skillIndex}.png`}
                alt="skill-icon"
              />
            </Tooltip>
            {createMode ? (
              <CustomInput
                name="level"
                value={level === 0 || level == null ? '' : String(level)}
                onChange={(e) => handleLevelChange(e, index)}
              />
            ) : (
              <Typography variant="body1">{level || <span>&nbsp;</span>}</Typography>
            )}
          </Stack>
        );
      })}
    </Stack>
  );

  const noteBlock = createMode ? (
    <CustomMultiline
      name="note"
      minRows={layout === 'row' ? 9 : 2}
      multiline
      placeholder={`Strategy notes for this tab…`}
      value={noteValue}
      onChange={handleNoteChange}
    />
  ) : note ? (
    <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.02)', width: '100%' }}>
      <CardContent>
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{note}</Typography>
      </CardContent>
    </Card>
  ) : null;

  if (layout === 'row') {
    return (
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        gap={2}
        alignItems="flex-start"
        sx={{ width: '100%' }}
      >
        {grid}
        <Box sx={{ flexGrow: 1, width: '100%', minWidth: 0 }}>{noteBlock}</Box>
      </Stack>
    );
  }

  return (
    <Stack gap={2}>
      {grid}
      {noteBlock && <Box sx={{ width: 320 }}>{noteBlock}</Box>}
    </Stack>
  );
};

const TalentTooltip = ({ name, skill, level }) => {
  const { description, funcX, x1, x2, funcY, y1, y2 } = skill;
  const realLevel = isNaN(parseInt(level)) ? 100 : parseInt(level);
  const mainStat = realLevel > 0 ? growth(funcX, realLevel, x1, x2) : 0;
  const secondaryStat = realLevel > 0 ? growth(funcY, realLevel, y1, y2) : 0;
  return (
    <>
      <Typography variant="h5">{cleanUnderscore(name)}</Typography>
      <Typography variant="body1">
        {cleanUnderscore(cleanUnderscore(description).replace('{', mainStat).replace('}', secondaryStat))}
      </Typography>
    </>
  );
};

const CustomInput = styled(InputBase)`
  & .MuiInputBase-input {
    border: 1px solid #7e7e7e;
    border-radius: 5px;
    padding: 3px;
    text-align: center;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &[type=number] {
      -moz-appearance: textfield;
    }
  }
`;

const CustomMultiline = styled(TextField)`
  & {
    width: 100%;
  }
`;

export default BuildTab;
