import { Accordion, AccordionDetails, AccordionSummary, Divider, Stack, Typography } from '@mui/material';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import { useTheme } from '@emotion/react';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { deepPurple, green } from '@mui/material/colors';
import { patchNotes } from '../data/patch-notes';

const PatchNotes = ({ patchNotes: pNotes }) => {
  const [noteIndex, setNoteIndex] = useState(0);
  const theme = useTheme();
  if (!pNotes) {
    return <Stack divider={<Divider/>} gap={3}>
      {patchNotes?.map((note, index) => {
        return <Stack gap={1} key={'note' + index}>
          <Typography variant={'h3'}>v{note?.ver}</Typography>
          <StyledSection icon={'add'} topMargin={false} title={"Features"} list={note?.features}/>
          <StyledSection icon={"fix"} topMargin={false} title={"Fixes"} list={note?.fixes}/>
        </Stack>
      })}
    </Stack>
  }
  return (pNotes || patchNotes)?.map((note, index) => {
    return <Accordion key={'note' + index} expanded={noteIndex === index}
                      disableGutters
                      sx={{
                        '&:before': { display: 'none' },
                        border: `1px solid ${theme.palette.divider}`,
                        '&:not(:last-child)': {
                          borderBottom: 0,
                        },
                      }}
                      onChange={(e, expanded) => setNoteIndex(expanded ? index : null)}>
      <AccordionSummary
        sx={{
          flexDirection: 'row-reverse', gap: 2,
          '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
            transform: 'rotate(90deg)',
          }
        }}
        expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }}/>}
      >v{note?.ver} - {note?.date}</AccordionSummary>
      <AccordionDetails sx={{ backgroundColor: 'rgb(22, 22, 22)', p: 3 }}>
        <Stack gap={3}>
          <StyledSection icon={'add'} topMargin={false} title={"Features"} list={note?.features}/>
          <StyledSection icon={"fix"} topMargin={false} title={"Fixes"} list={note?.fixes}/>
        </Stack>
      </AccordionDetails>
    </Accordion>
  })
}

const StyledSection = ({ title, list, icon, topMargin = true }) => {
  if (!list || list.length === 0) return null;
  const icons = {
    'add': <AddIcon sx={{ color: green[600] }}/>,
    'fix': <CheckIcon sx={{ color: deepPurple[300] }}/>
  }
  return (
    <Box sx={{ marginTop: topMargin ? '20px' : 0 }}>
      <Stack direction={'row'} alignItems={'center'} gap={1}>
        {icons[icon]}
        <Typography sx={{ color: icon === 'add' ? green[500] : deepPurple[200] }} variant={"h4"}>{title}</Typography>
      </Stack>
      <ul style={{ marginTop: 20 }}>
        {list.map((item, index) => {
          return (
            <li key={`${title}-${index}`} style={{ marginTop: 5 }}>
              <Typography variant={"body1"} component={"div"}>
                {item}
              </Typography>
            </li>
          );
        })}
      </ul>
    </Box>
  );
};

export default PatchNotes;
