import React, { useMemo, useState } from 'react';
import { Box, Divider, Grid, Stack, Typography, useMediaQuery } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { cleanUnderscore, getTabs, prefix } from 'utility/helpers';
import Tabber from '../../common/Tabber';
import { PAGES } from '@components/constants';

const StarSigns = ({ starSigns, infiniteStars }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const chronus = useMemo(() => starSigns.filter(({ tree }) => tree === 'chronus'), [starSigns, infiniteStars]);
  const hydron = useMemo(() => starSigns.filter(({ tree }) => tree === 'hydron'), [starSigns, infiniteStars]);
  const seraph = useMemo(() => starSigns.filter(({ tree }) => tree === 'seraph'), [starSigns, infiniteStars]);
  infiniteStars = selectedTab === 0 ? infiniteStars : selectedTab === 1 ? infiniteStars - 34 : infiniteStars - 63;

  return (
    <>
      <Tabber queryKey={'nt'} tabs={getTabs(PAGES.ACCOUNT.misc.categories, 'constellations', 'Star Signs')} onTabChange={(selected) => setSelectedTab(selected)}>
        <Stack gap={3}>
          <Grid container>
            <Grid item md={4} sx={{ display: { sm: 'none', md: 'block' } }}>Name</Grid>
            <Grid item xs={8} md={4}>Bonuses</Grid>
            <Grid item xs={2} md={4} pl={5}>Cost</Grid>
          </Grid>
          {(selectedTab === 0 ? chronus : selectedTab === 1 ? hydron : seraph)?.map((starSign, index) => {
            const { indexedStarName, cost, unlocked, bonuses, description } = starSign;
            return (!indexedStarName.includes('Filler') && !indexedStarName.includes('Unknown')) &&
              <React.Fragment key={name + ' ' + index}>
                <Grid rowGap={2} container>
                  <Grid item alignItems={'center'} gap={2} md={4} sx={{
                    display: { sm: 'none', md: 'flex' },
                    justifyContent: { xs: 'center', sm: 'center', md: 'flex-start' }
                  }}>
                    {unlocked ? <CheckIcon color={'success'}/> : <Box width={24} height={24}/>}
                    {!isMd ?
                      <>
                        <Typography variant={'body1'} component={'span'}>{cleanUnderscore(indexedStarName)}</Typography>
                        {unlocked && index < infiniteStars ?
                          <img src={`${prefix}data/SignStarInf${selectedTab}.png`} alt="star-sign-icon"/> : null}
                      </> : null}
                  </Grid>
                  <Grid item sm={7} md={4} display={'flex'} alignItems={'center'} gap={2}>
                    {isMd && unlocked ? <CheckIcon color={'success'}/> : null}
                    <Typography variant={'body1'}
                                component={'span'}>
                      {bonuses
                        ? bonuses?.map(({
                                          rawName,
                                          bonus
                                        }) => cleanUnderscore(rawName.replace("{.{", bonus).replace(/{/g, bonus))).join(', ')
                        : cleanUnderscore(description)}
                    </Typography>
                  </Grid>
                  <Grid item sm={4} md={4}> <Typography variant={'body1'}
                                                        pl={5}
                                                        component={'span'}>{cost}</Typography>
                  </Grid>
                </Grid>
                {starSigns.length - 1 !== index ? <Divider/> : null}
              </React.Fragment>
          })}
        </Stack>
      </Tabber>
    </>
  );
};

export default StarSigns;
