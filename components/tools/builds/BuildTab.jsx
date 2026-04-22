import React from 'react';
import { Box, Button, Card, CardContent, InputBase, Stack, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Tooltip from '@components/Tooltip';
import ItemRefRenderer from './ItemRefRenderer';
import { cleanUnderscore, growth, prefix } from '@utility/helpers';
import styled from '@emotion/styled';

// Fully controlled: talent values come straight from the parent
// (BuildForm or BuildDetail). No local mirrors, no useEffect resync needed.
//
// `layout` controls how the grid and the (view-only) tab-note are arranged:
//   'stack'  (default) — grid on top, note card below (view / detail pages)
//   'row'              — grid left, note card fills right (edit form)
//
// Create/edit mode no longer offers a note INPUT — authors describe tab
// strategy inline in the main rich-text description via @-mentions and
// headings. Pre-existing builds that still carry a `note` render it read-only
// in edit mode with a Remove button (so authors aren't stuck with frozen
// legacy data), and render it normally in view mode.
const BuildTab = ({ note, talents: talentList = [], createMode, onCustomBuildChange, tabIndex, layout = 'stack' }) => {
  const talents = talentList || [];

  const handleLevelChange = (e, index) => {
    const val = e.target.value;
    const nextTalents = talents.map((talent, ind) =>
      ind === index ? { ...talent, level: val === '' ? 0 : val } : talent
    );
    onCustomBuildChange?.({ tabIndex, tabTalents: nextTalents });
  };

  const handleRemoveLegacyNote = () => {
    onCustomBuildChange?.({ tabIndex, tabNote: '' });
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

  // Note card. In view mode, renders normally. In create/edit mode with a
  // legacy note, renders read-only with a Remove button so the author can
  // delete it and migrate the content into the main description manually.
  const noteBlock = note ? (
    <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.02)', width: '100%' }}>
      <CardContent>
        {createMode && (
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
              Legacy tab note (read-only). Move this content into the main description.
            </Typography>
            <Button
              size="small"
              color="inherit"
              startIcon={<DeleteOutlineIcon fontSize="small"/>}
              onClick={handleRemoveLegacyNote}
            >
              Remove
            </Button>
          </Stack>
        )}
        <ItemRefRenderer text={note}/>
      </CardContent>
    </Card>
  ) : null;

  if (layout === 'row') {
    // Create mode has no noteBlock — just the grid. The enclosing tab card
    // shrinks to fit the 320px grid so several tabs can sit side-by-side
    // instead of each stretching full-width with a big empty region.
    if (!noteBlock) return grid;
    // View/edit with a legacy note: CSS container query switches between
    // column (narrow card) and row (wide card) based on the card's own
    // width, not the viewport.
    // Threshold 600px = 320 (grid) + 16 (gap) + 264 (min useful note width).
    return (
      <Box sx={{ containerType: 'inline-size', width: '100%' }}>
        <Stack
          direction="column"
          gap={2}
          alignItems="flex-start"
          sx={{
            width: '100%',
            '@container (min-width: 600px)': {
              flexDirection: 'row'
            }
          }}
        >
          {grid}
          <Box sx={{ flexGrow: 1, width: '100%', minWidth: 0 }}>{noteBlock}</Box>
        </Stack>
      </Box>
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

export default BuildTab;
