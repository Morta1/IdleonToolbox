import { Accordion, AccordionDetails, AccordionSummary, Divider, Stack, Typography } from '@mui/material';
import React, { useState } from 'react';
import { NextSeo } from 'next-seo';
import Box from '@mui/material/Box';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import { useTheme } from '@emotion/react';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { format, isValid } from 'date-fns';
import { patchNotes } from '../data/patch-notes';

// A note's stored date is DD/MM/YYYY. Read by its parts and printed with the month's name, so it says the same on the
// export, in every zone and to a reader of either date order.
const patchDate = (note) => {
  const [day, month, year] = `${note?.date ?? ''}`.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return isValid(date) ? format(date, 'MMM do, yyyy') : note?.date;
};

const PatchNotes = ({ patchNotes: pNotes }) => {
  const [noteIndex, setNoteIndex] = useState(0);
  const theme = useTheme();
  const seo = !pNotes ? <NextSeo
    title="Patch Notes | Idleon Toolbox"
    description="View the latest Idleon Toolbox patch notes, new features, bug fixes, and changelog for every version"
  /> : null;
  if (!pNotes) {
    return <>{seo}<Stack divider={<Divider/>} gap={3}>
      {patchNotes?.map((note, index) => {
        return <Stack gap={1} key={'note' + index}>
          <Stack direction={'row'} alignItems={'baseline'} columnGap={1.5} flexWrap={'wrap'}>
            <Typography variant={'sectionTitle'} component={'h2'}>v{note?.ver}</Typography>
            <Typography variant={'body2'} color={'text.secondary'}>{patchDate(note)}</Typography>
          </Stack>
          <StyledSection icon={'add'} topMargin={false} title={"Features"} list={note?.features}/>
          <StyledSection icon={"fix"} topMargin={false} title={"Fixes"} list={note?.fixes}/>
        </Stack>
      })}
    </Stack></>
  }
  return <>{seo}{(pNotes || patchNotes)?.map((note, index) => {
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
      >v{note?.ver} · {patchDate(note)}</AccordionSummary>
      <AccordionDetails sx={{ backgroundColor: 'background.paper', p: 3 }}>
        <Stack gap={3}>
          <StyledSection icon={'add'} topMargin={false} title={"Features"} list={note?.features}/>
          <StyledSection icon={"fix"} topMargin={false} title={"Fixes"} list={note?.fixes}/>
        </Stack>
      </AccordionDetails>
    </Accordion>
  })}</>
}

const StyledSection = ({ title, list, icon, topMargin = true }) => {
  if (!list || list.length === 0) return null;
  const icons = {
    'add': <AddIcon sx={{ color: 'text.success' }}/>,
    'fix': <CheckIcon sx={{ color: 'primary.main' }}/>
  }
  return (
    <Box sx={{ marginTop: topMargin ? '20px' : 0 }}>
      <Stack direction={'row'} alignItems={'center'} gap={1}>
        {icons[icon]}
        <Typography variant={'cardTitle'} component={'h3'}>{title}</Typography>
      </Stack>
      <Box component={'ul'} sx={{ mt: 1.5, mb: 0, pl: 3 }}>
        {list.map((item, index) => {
          return (
            <Box component={'li'} key={`${title}-${index}`} sx={{ mt: 0.5 }}>
              <Typography variant={"body2"} component={"div"}>
                {item}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default PatchNotes;
