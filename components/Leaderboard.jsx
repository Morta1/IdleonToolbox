import React, { Fragment } from 'react';
import {
  Divider,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { notateNumber, prefix } from '../utility/helpers';
import Box from '@mui/material/Box';
import styled from '@emotion/styled'; // Grid version 2

const HIGHLIGHTED_OUTLINED_COLOR = '#007E85';
const SECONDARY_HIGHLIGHTED_OUTLINED_COLOR = '#cd861b';
const HIGHLIGHTED_BG_COLOR = '#12141c'

const CARD_BASE_HEIGHT = 125;

const specialNotation = (sectionName, value) => {
  if (sectionName === 'bits') {
    return notateNumber(value, 'bits');
  } else if (sectionName === 'dropRate') {
    return notateNumber(value, 'MultiplierInfo');
  }
  return notateNumber(value)
}

const LeaderboardSection = ({ leaderboards, loggedMainChar, searchedChar }) => {
  return (
    <Grid sx={{ width: '100%', margin: '0 auto' }}
          justifySelf={'center'}
          container
          rowSpacing={3}
          columnSpacing={{ xs: 4, xl: 12 }}
    >
      {Object.entries(leaderboards || {}).map(([sectionName, list], sectionIndex) => {
        const positions = {}
        const players = list.map((entry, index) => {
          const char = entry.mainChar;
          const isLoggedMainChar = char === loggedMainChar;
          const isSearchedChar = char === searchedChar;

          if ((isLoggedMainChar || isSearchedChar) && index >= 10) {
            positions[char] = index + 1;
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
          const key = entry.mainChar === loggedMainChar ? 'loggedMainChar' : 'searchedChar';
          return {
            ...entry,
            [key]: true,
            index: position
          };
        }, [])
        const topThree = players?.toSpliced(3);
        const rest = players?.slice(0, 10).concat(additional);
        const isEmpty = list?.length === 0;
        return (
          <Grid
            key={`${sectionName}-${sectionIndex}`}
            size={{
              xs: 12,
              sm: 4,
              xl: 3
            }}>
            <Typography textAlign={'center'} variant={'h5'} mt={{ xs: 3, lg: 0 }}
                        mb={{ xs: 3, lg: 1 }}>{sectionName.camelToTitleCase()}</Typography>
            {!isEmpty ? <>
              {/*<TopThree sectionName={sectionName} topThree={topThree}/>*/}
              <List dense disablePadding>
                {rest.map((entry, index) => {
                  const value = entry?.[sectionName] || 0;
                  const img = index === 0 ? 'data/Trophie.png' : index === 1 ? 'data/G2icon40.png' : index === 2
                    ? 'data/G2icon39.png'
                    : '';

                  return <Fragment key={`${sectionName}-${index}`}>
                    <ListItem
                      disablePadding
                      sx={{
                        borderRadius: index === 0 ? '8px 8px 0 0' : index === rest.length - 1 ? '0 0 8px 8px' : '',
                        '&:hover': {
                          borderRadius: index === 0 ? '8px 8px 0 0' : index === rest.length - 1 ? '0 0 8px 8px' : ''
                        },
                        mb: entry?.loggedMainChar || entry?.searchedChar ? .8 : 0,
                        backgroundColor: entry?.loggedMainChar || entry?.searchedChar
                          ? HIGHLIGHTED_BG_COLOR
                          : '#1e262e',
                        outline: entry?.loggedMainChar || entry?.searchedChar ? '2px solid' : 'none',
                        outlineColor: entry?.loggedMainChar ? HIGHLIGHTED_OUTLINED_COLOR : entry?.searchedChar
                          ? SECONDARY_HIGHLIGHTED_OUTLINED_COLOR
                          : ''
                      }}
                        secondaryAction={<Typography sx={{ pr: 2, py: 1 }} variant={'body2'}>
                        {specialNotation(sectionName, value)}
                      </Typography>}
                    >
                      <ListItemButton component={Link} target={'_blank'}
                                      href={`https://idleontoolbox.com?profile=${entry?.mainChar}`} disableGutters
                                      sx={{
                                        pl: 2, py: 1, borderRadius: 'inherit' // Inherits borderRadius from ListItem
                                      }}>
                        <ListItemIcon>
                          {img ? <img width={24} height={24} style={{ objectFit: 'contain' }}
                                      src={`${prefix}${img}`} alt={''}/> : <PositionCircle inline
                                                                                           sx={{ mr: 2 }}>{entry?.index
                            ? entry?.index
                            : index + 4}</PositionCircle>}
                        </ListItemIcon>
                        <ListItemText
                          primary={entry?.mainChar}
                          slotProps={{ primary: { variant: 'body1' } }}/>
                      </ListItemButton>
                    </ListItem>
                    {index < rest.length - 1 ? <Divider component="li"/> : null}
                  </Fragment>
                })}
              </List>
            </> : <Typography textAlign={'center'} mt={5} variant={'h6'}>Nothing here yet</Typography>}
          </Grid>
        );
      })}
    </Grid>
  );
};

const TopThree = ({ sectionName, topThree }) => {
  return (
    <Grid container spacing={4}>
      {topThree.map((entry, index) => {
        const order = index === 0 ? 2 : index === 1 ? 1 : 3;
        const height = index === 0 ? CARD_BASE_HEIGHT : index === 1 ? CARD_BASE_HEIGHT - 10 : CARD_BASE_HEIGHT - 20;
        const img = index === 0 ? 'data/Trophie.png' : index === 1 ? 'data/G2icon40.png' : 'data/G2icon39.png';
        const value = entry?.[sectionName] || 0;
        return (
          <Grid order={order}
                alignSelf={'flex-end'}
                key={`top-three-${sectionName}-${entry?.mainChar}`}
                size={topThree?.length === 1 ? 12 : 4}>
            <Wrapper height={height}>
              <Stack sx={{ height: '100%' }} gap={1} alignItems={'center'} justifyContent={'center'} direction={'row'}>
                <Typography>{index + 1}</Typography>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img width={index === 2 ? 20 : 24} height={index === 2 ? 20 : 24} style={{ objectFit: 'contain' }}
                       src={`${prefix}${img}`} alt={''}/>
                </Box>
              </Stack>
              <TextWrapper loggedMainChar={entry?.loggedMainChar} searchedChar={entry?.searchedChar}>
                <Stack>
                  <Typography textAlign={'center'}>
                    <Link color={'inherit'} underline={'hover'} target={'_blank'}
                          href={`https://idleontoolbox.com?profile=${entry?.mainChar}`}>{entry?.mainChar}</Link>
                  </Typography>
                  <Typography textAlign={'center'}>{specialNotation(sectionName, value)}</Typography>
                </Stack>
              </TextWrapper>
            </Wrapper>
          </Grid>
        );
      })}
    </Grid>
  );
}

const PositionCircle = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'inline'
})`
  display: ${({ inline }) => inline ? 'inline-flex' : 'flex'};
  align-items: center;
  justify-content: center;
  background-color: ${({ bgColor }) => bgColor ? bgColor : '#ffffff21'};
  border-radius: 50%;
  width: 32px;
  height: 32px;
`;

const Wrapper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'bgColor' && prop !== 'order' && prop !== 'inline'
})`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 12px;
  box-shadow: none;
  height: ${({ height }) => height}px;
  order: ${({ order }) => order};
`;

const TextWrapper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'searchedChar' && prop !== 'loggedMainChar'
})`
  display: flex;
  padding: 8px;
  margin: auto auto 0 auto;
  justify-content: center;
  border-radius: 12px 12px 0 0;
  box-shadow: none;
  width: 100%;
  background-color: ${({ outline }) => outline ? HIGHLIGHTED_BG_COLOR : '#1e262e'};
  outline: ${({ loggedMainChar, searchedChar }) => loggedMainChar || searchedChar ? '3px solid' : 'none'};
  outline-color: ${({ loggedMainChar, searchedChar }) => loggedMainChar ? HIGHLIGHTED_OUTLINED_COLOR : searchedChar
          ? SECONDARY_HIGHLIGHTED_OUTLINED_COLOR
          : ''}
`

export default LeaderboardSection;
