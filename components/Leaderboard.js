import React from 'react';
import { Divider, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { notateNumber, prefix } from '../utility/helpers';
import Box from '@mui/material/Box';
import styled from '@emotion/styled'; // Grid version 2

const COLORS = {
  FIRST: '#e1ba1f',
  SECOND: '#567BB7',
  THIRD: '#7172B4'
}

const HIGHLIGHTED_OUTLINED_COLOR = '#007E85';
const HIGHLIGHTED_BG_COLOR = '#12141c'

const CARD_BASE_HEIGHT = 125;

const LeaderboardSection = ({ leaderboards, loggedMainChar }) => {
  return <Grid sx={{ width: '100%', margin: '0 auto' }}
               justifySelf={'center'}
               container
               rowSpacing={3}
               columnSpacing={{ lg: 4, xl: 12 }}>
    {Object.entries(leaderboards || {}).map(([sectionName, list], index) => {
      let topThree, rest = list.slice(3, 10);
      const topTenIndex = list?.toSpliced(10).findIndex((entry) => entry?.mainChar === loggedMainChar);
      if (topTenIndex !== -1) {
        list = list?.map((char, charIndex) => (charIndex === topTenIndex ? {
          ...char,
          loggedMainChar: true,
          index: topTenIndex
        } : char));
        rest = list.slice(3, 10)
      } else {
        const loggedMainCharIndex = list?.findIndex((entry) => entry?.mainChar === loggedMainChar);
        const loggedMainCharEntry = list?.[loggedMainCharIndex];
        if (loggedMainCharIndex !== -1) {
          rest = list.slice(3, 10).concat([{
            ...loggedMainCharEntry,
            index: loggedMainCharIndex
          }])
        }
      }
      topThree = list?.toSpliced(3);
      const isEmpty = list?.length === 0;
      return <Grid xs={12} lg={6} xl={4}
                   key={`${sectionName}-${index}`}>
        <Typography textAlign={'center'} variant={'h4'} mt={{ xs: 3, lg: 0 }}
                    mb={{ xs: 3, lg: 1 }}>{sectionName.camelToTitleCase()}</Typography>
        {!isEmpty ? <>
          <TopThree sectionName={sectionName} topThree={topThree}/>
          <List>
            {rest.map((entry, index) => {
              return <ListItem
                sx={{
                  backgroundColor: entry?.index ? HIGHLIGHTED_BG_COLOR : '#1a1d2a',
                  border: entry?.index ? '2px solid' : 'none',
                  borderColor: entry?.index ? HIGHLIGHTED_OUTLINED_COLOR : ''
                }}
                secondaryAction={<Typography>{notateNumber(entry?.[sectionName])}</Typography>}
                key={`${sectionName}-${index}`}>
                <ListItemText><PositionCircle inline sx={{ mr: 2 }}>{entry?.index
                  ? entry?.index
                  : index + 4}</PositionCircle> {entry?.mainChar}</ListItemText>
              </ListItem>
            })}
          </List>
        </> : <>
          <Typography textAlign={'center'} mt={5} variant={'h6'}>Nothing here yet</Typography>
        </>}
      </Grid>
    })}
  </Grid>
};

const TopThree = ({ sectionName, topThree }) => {
  return <Grid container spacing={4}>
    {topThree.map((entry, index) => {
      const order = index === 0 ? 2 : index === 1 ? 1 : 3;
      const height = index === 0 ? CARD_BASE_HEIGHT : index === 1 ? CARD_BASE_HEIGHT - 10 : CARD_BASE_HEIGHT - 20;
      // const bgColor = index === 0 ? COLORS.FIRST : index === 1 ? COLORS.SECOND : COLORS.THIRD;
      const img = index === 0 ? 'data/Trophie.png' : index === 1 ? 'data/G2icon40.png' : 'data/G2icon39.png';
      return <Grid xs={topThree?.length === 1 ? 12 : 4}
                   order={order}
                   alignSelf={'flex-end'}
                   key={`top-three-${sectionName}-${entry?.mainChar}`}>
        <Wrapper height={height}>
          <Stack sx={{ height: '100%' }} gap={1} alignItems={'center'} justifyContent={'center'} direction={'row'}>
            <Typography>{index + 1}</Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img width={index === 2 ? 20 : 24} height={index === 2 ? 20 : 24} style={{ objectFit: 'contain' }}
                   src={`${prefix}${img}`}/>
            </Box>
          </Stack>
          {/*<PositionCircle sx={{ m: 'auto' }}>{index + 1}</PositionCircle>*/}
          {/*<Typography sx={{ m: 'auto' }}>{index + 1}</Typography>*/}
          <TextWrapper outline={entry?.loggedMainChar}>
            <Stack justifyContent={'center'}>
              <Typography textAlign={'center'}
                          sx={{
                            mt: 'auto'
                          }}>{entry?.mainChar}</Typography>
              <Typography textAlign={'center'}>{notateNumber(entry?.[sectionName])}</Typography>
            </Stack>
          </TextWrapper>
        </Wrapper>
      </Grid>
    })}
  </Grid>
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
  shouldForwardProp: (prop) => prop !== 'outline'
})`
  display: flex;
  padding: 8px;
  margin: auto auto 0 auto;
  justify-content: center;
  border-radius: 12px 12px 0 0;
  box-shadow: none;
  width: 100%;
  background-color: ${({ outline }) => outline ? HIGHLIGHTED_BG_COLOR : '#161826'};
  outline: ${({ outline }) => outline ? '3px solid' : 'none'};
  outline-color: ${HIGHLIGHTED_OUTLINED_COLOR};
`

export default LeaderboardSection;
