import React, { Fragment } from 'react';
import { Divider, Link, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import Box from '@mui/material/Box';
import styled from '@emotion/styled'; // Grid version 2
import HtmlTooltip from './Tooltip';
import { IconInfoCircle } from '@tabler/icons-react';

const HIGHLIGHTED_OUTLINED_COLOR = '#007E85';
const SECONDARY_HIGHLIGHTED_OUTLINED_COLOR = '#cd861b';
const HIGHLIGHTED_BG_COLOR = '#12141c'

const specialNotation = (sectionName, value) => {
  if (sectionName === 'globalRanking') {
    return numberWithCommas(Math.round(value)) + ' pts';
  } else if (sectionName === 'bits') {
    return notateNumber(value, 'bits');
  } else if (sectionName === 'dropRate') {
    return notateNumber(value, 'MultiplierInfo');
  }
  return notateNumber(value)
}

const LeaderboardSection = ({ leaderboards, loggedMainChar, searchedChar }) => {
  return (
    <Grid sx={{ width: '100%', margin: '0 auto', justifyContent: 'center' }}
          container
          rowSpacing={3}
          columnSpacing={{ xs: 1, xl: 2 }}
    >
      {Object.entries(leaderboards || {}).map(([sectionName, list], sectionIndex) => {
        const positions = {}
        const displayCount = sectionName === 'globalRanking' ? 25 : 10;
        const players = list.map((entry, index) => {
          const char = entry.mainChar;
          const isLoggedMainChar = char === loggedMainChar;
          const isSearchedChar = char === searchedChar;

          if (index >= displayCount) {
            positions[char] = entry?.rank;
          }

          return {
            ...entry,
            ...(isLoggedMainChar && { loggedMainChar: true }),
            ...(isSearchedChar && { searchedChar: true }),
            index: index + 1
          };
        });
        const additional = Object.entries(positions)?.map(([name, position]) => {
          const entry = list?.find((entry) => entry?.mainChar === name);
          const isSearched = entry.mainChar === searchedChar;
          const isLogged = entry.mainChar === loggedMainChar;
          return {
            ...entry,
            ...(isSearched && { searchedChar: true }),
            ...(isLogged && { loggedMainChar: true }),
            ...(!isSearched && !isLogged && { neighbor: true }),
            index: position
          };
        }, []);
        const rest = players?.slice(0, displayCount).concat(additional);
        const isEmpty = list?.length === 0;
        return (
          <Box
            key={`${sectionName}-${sectionIndex}`}
            sx={{
              display: 'grid',
              '--auto-grid-min-size': '18rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(var(--auto-grid-min-size), 1fr))',
              alignSelf: 'flex-start',
              gap: '1rem'
            }}
          >
            {sectionName === 'globalRanking' ? <Stack direction={'row'} justifyContent={'center'} alignItems={'center'} gap={1}
                        mt={{ xs: 3, lg: 0 }} mb={{ xs: 3, lg: 1 }}>
              <Typography textAlign={'center'} variant={'h5'}>{sectionName.camelToTitleCase()}</Typography>
              <HtmlTooltip followCursor={false} title="Score is calculated by summing each player's percentile rank across all leaderboard metrics. Higher placement in more categories means a higher score."
                       arrow placement="top">
                <IconInfoCircle size={20} />
              </HtmlTooltip>
            </Stack> : <Typography textAlign={'center'} variant={'h5'} mt={{ xs: 3, lg: 0 }}
                        mb={{ xs: 3, lg: 1 }}>{sectionName.camelToTitleCase()}</Typography>}
            {!isEmpty ? <>
              <List dense disablePadding>
                {rest.map((entry, index) => {
                  const value = entry?.[sectionName] || 0;
                  const img = index === 0 ? 'data/Trophie.png' : index === 1 ? 'data/G2icon40.png' : index === 2
                    ? 'data/G2icon39.png'
                    : '';

                  return <Fragment key={`${sectionName}-${index}`}>
                    <ListItem
                      ref={entry?.searchedChar && sectionName === 'globalRanking' ? (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }) : undefined}
                      disablePadding
                      sx={{
                        borderRadius: index === 0 ? '8px 8px 0 0' : index === rest.length - 1 ? '0 0 8px 8px' : '',
                        '&:hover': {
                          borderRadius: index === 0 ? '8px 8px 0 0' : index === rest.length - 1 ? '0 0 8px 8px' : ''
                        },
                        marginTop: sectionName === 'globalRanking' && index === displayCount && additional.length > 0 ? 2 : 0,
                        backgroundColor: entry?.loggedMainChar || entry?.searchedChar
                          ? HIGHLIGHTED_BG_COLOR
                          : '#1e262e',
                        border: entry?.loggedMainChar || entry?.searchedChar ? '2px solid' : 'none',
                        borderColor: entry?.loggedMainChar ? HIGHLIGHTED_OUTLINED_COLOR : entry?.searchedChar
                          ? SECONDARY_HIGHLIGHTED_OUTLINED_COLOR
                          : ''
                      }}
                      secondaryAction={<Typography sx={{ pr: 2 }} variant={'body2'}>
                        {specialNotation(sectionName, value)}
                      </Typography>}
                    >
                      <ListItemButton component={Link} target={'_blank'}
                                      href={`${process.env.NEXT_PUBLIC_IT_URL}/account/misc/general?profile=${entry?.mainChar}`} disableGutters
                                      sx={{
                                        pl: 2, py: .5, borderRadius: 'inherit' // Inherits borderRadius from ListItem
                                      }}>
                        <ListItemIcon>
                          {img ? <img width={24} height={24} style={{ objectFit: 'contain' }}
                                      src={`${prefix}${img}`} alt={''}/> : <PositionCircle inline>
                            <Typography variant={'body2'}>
                              {entry?.index ? entry?.index : index + 4}
                            </Typography>
                          </PositionCircle>}
                        </ListItemIcon>
                        <ListItemText
                          primary={entry?.mainChar}
                          sx={{ mr: 8 }}
                          slotProps={{ primary: { variant: 'body1' } }}/>
                      </ListItemButton>
                    </ListItem>
                    {index < rest.length - 1 ? <Divider component="li"/> : null}
                  </Fragment>
                })}
              </List>
            </> : <Typography textAlign={'center'} mt={5} variant={'h6'}>Nothing here yet</Typography>}
          </Box>
        );
      })}
    </Grid>
  );
};

const PositionCircle = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'inline'
})`
  display: ${({ inline }) => inline ? 'inline-flex' : 'flex'};
  align-items: center;
  justify-content: center;
  background-color: ${({ bgColor }) => bgColor ? bgColor : '#ffffff21'};
  border-radius: 50%;
  width: 24px;
  height: 24px;
`;

export default LeaderboardSection;
