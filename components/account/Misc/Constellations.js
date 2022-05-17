import { Divider, Grid, Stack, Typography, useMediaQuery } from "@mui/material";
import React from "react";
import { cleanUnderscore, constellationIndexes } from "utility/helpers";
import CheckIcon from "@mui/icons-material/Check";

const ConstellationsComp = ({ constellations }) => {
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const getTotalPoints = () => {
    const { ownedPoints, totalPoints } = constellations?.reduce((res, { points, done }) => {
      if (done) {
        res.ownedPoints += points;
      }
      res.totalPoints += points;
      return res;
    }, { ownedPoints: 0, totalPoints: 0 });
    return `${ownedPoints} / ${totalPoints}`;
  }
  return (
    <Stack gap={3}>
      <Typography variant={'h5'} textAlign={'center'}>Total Points: {getTotalPoints()}</Typography>
      <Grid rowGap={2} justifyContent={'center'} container>
        {!isMd ? <Grid item xs={1}>
          <Typography variant={'body1'} component={'span'}>Name</Typography></Grid> : null}
        <Grid item xs={1}>
          <Typography variant={'body1'} component={'span'}>{!isMd ? 'Progress' : ''}</Typography></Grid>
        <Grid item xs={2}>
          <Typography pl={!isMd ? 6 : 0} variant={'body1'}
                      component={'span'}>{!isMd ? 'Location' : 'Loc.'}</Typography></Grid>
        <Grid item xs={3}>
          <Typography pl={!isMd ? 6 : 0} variant={'body1'}
                      component={'span'}>{!isMd ? 'Requirement' : 'Req.'}</Typography></Grid>
        <Grid item xs={4}>
          <Typography pl={!isMd ? 6 : 0} variant={'body1'} component={'span'}>Points</Typography></Grid>
        <Grid item md={1}/>
      </Grid>
      {constellations?.map((constellation, index) => {
        const { name, points, done, requirement, completedChars, requiredPlayers, location } = constellation;
        return <React.Fragment key={name + ' ' + index}>
          <Grid rowGap={2} gap={1} container>
            {!isMd ? <Grid item xs={1}>
              <Typography variant={'body1'} component={'span'}>{cleanUnderscore(name)}</Typography>
            </Grid> : null}
            <Grid item xs={1}>
              {done ? <CheckIcon color={'success'}/> : <Typography variant={'body1'}
                                                                   component={'span'}>
                {`${completedChars.length}/${requiredPlayers}`}
              </Typography>}
            </Grid>
            <Grid item xs={2}>
              {(location === 'End_Of_The_Road') ? cleanUnderscore(location) + ' *' : cleanUnderscore(location)}
            </Grid>
            <Grid item xs={3}>{cleanUnderscore(requirement)}</Grid>
            <Grid item xs={2} sm={1}>{points}</Grid>
            <Grid item xs={2}>
              {completedChars.length ?
                <><Typography variant={'caption'} component={'div'}>Completed Chars</Typography>
                  <Typography variant={'caption'}
                              sx={{ wordBreak: 'break-word' }}>indexes: {constellationIndexes(completedChars)}</Typography></> : null}
            </Grid>
          </Grid>
          {constellations.length - 1 !== index ? <Divider/> : null}
        </React.Fragment>
      })}
    </Stack>
  );
};

export default ConstellationsComp;
