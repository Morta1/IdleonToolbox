import {
  Button,
  Checkbox,
  Collapse,
  Divider,
  FormControlLabel,
  Grid,
  Link,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { cleanUnderscore, prefix } from 'utility/helpers';
import CheckIcon from '@mui/icons-material/Check';
import { mapEnemiesArray, monsters } from '@website-data';

const ConstellationsComp = ({ constellations = [], characters = [] }) => {
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const [hideCompleted, setHideCompleted] = useState(false);
  const [expandedHints, setExpandedHints] = useState({});

  const characterNames = useMemo(() => characters?.map(({ name }) => name) || [], [characters]);
  const constellationList = useMemo(() => hideCompleted ? constellations?.filter(({ done }) => !done) : constellations,
    [constellations, hideCompleted]);

  const charIndexMap = useMemo(() => {
    const alphabet = '_abcdefghijklmnopqrstuvwxyz';
    return alphabet.split('').reduce((acc, char, idx) => ({ ...acc, [char]: idx }), {});
  }, []);

  const getCompletedNames = (completedChars) => {
    const indices = completedChars
      ?.split('')
      ?.map((char) => charIndexMap?.[char])
      ?.filter((idx) => idx !== undefined);
    const uniqueSorted = [...new Set(indices)]?.sort((a, b) => a - b);
    return uniqueSorted?.map((idx) => characterNames?.[idx] || `Char ${idx + 1}`) || [];
  };

  const toggleHint = (name) => {
    setExpandedHints((prev) => ({ ...prev, [name]: !prev?.[name] }));
  };

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
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent={'space-between'} gap={1} alignItems={'center'}>
        <Typography variant={'h5'} textAlign={'center'}>Total Points: {getTotalPoints()}</Typography>
        <FormControlLabel control={<Checkbox checked={hideCompleted} onChange={(e) => setHideCompleted(e.target.checked)} />}
          label="Hide completed" />
      </Stack>
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
        <Grid item md={1} />
      </Grid>
      {constellationList?.map((constellation, index) => {
        const { name, points, done, requirement, completedChars, requiredPlayers, location, mapIndex } = constellation;
        const completedNames = getCompletedNames(completedChars);
        const monsterRaw = mapEnemiesArray?.[mapIndex];
        const monsterName = monsterRaw === 'Nothing' ? null : cleanUnderscore(monsters?.[monsterRaw]?.Name || monsterRaw);
        const world = Number.isInteger(mapIndex) ? Math.floor(mapIndex / 50) + 1 : null;
        const wikiAnchor = name?.replace('-', '_');
        const wikiLink = `https://idleon.miraheze.org/wiki/Star_Signs#${wikiAnchor}`;
        return <React.Fragment key={name + ' ' + index}>
          <Grid rowGap={2} gap={1} container>
            {!isMd ? <Grid item xs={1}>
              <Typography variant={'body1'} component={'span'}>{cleanUnderscore(name)}</Typography>
            </Grid> : null}
            <Grid item xs={1} display={'flex'} alignItems={'center'} gap={1}>
              {done ? <CheckIcon color={'success'} /> : <Typography variant={'body1'}
                component={'span'}>
                {`${completedChars?.length ?? 0}/${requiredPlayers}`}
              </Typography>}
            </Grid>
            <Grid item xs={2}>
              <Stack spacing={0.25}>
                <Typography variant={'body1'} component={'span'}>
                  {(location === 'End_Of_The_Road') ? cleanUnderscore(location) + ' *' : cleanUnderscore(location)}
                </Typography>
                {world ? <Typography variant={'caption'} color={'text.secondary'}>World {world}</Typography> : null}
                {monsterName ?
                  <Stack direction={'row'} spacing={0.5} alignItems={'center'}>
                    <img
                      src={`${prefix}afk_targets/${monsters?.[monsterRaw]?.Name}.png`}
                      alt={monsterName}
                      style={{ width: 28, height: 28, objectFit: 'contain' }}
                    />
                    <Typography variant={'caption'} color={'text.secondary'}>Mob: {monsterName}</Typography>
                  </Stack> : null}
              </Stack>
            </Grid>
            <Grid item xs={3}>{cleanUnderscore(requirement)}</Grid>
            <Grid item xs={2} sm={1}>{points}</Grid>
            <Grid item xs={2}>
              {completedNames?.length > 0
                ?
                <Stack spacing={0.25}>
                  <Typography variant={'caption'} component={'div'}>Completed By</Typography>
                  <Typography variant={'caption'}
                    sx={{ wordBreak: 'break-word' }}>{completedNames.join(', ')}</Typography>
                </Stack>
                : null}
            </Grid>
            <Grid item xs={12}>
              <Collapse in={expandedHints?.[name]}>
                <Stack spacing={0.5} pl={!isMd ? 1 : 0} pb={1}>
                  <Typography variant={'body2'}>
                    {cleanUnderscore(location)} {world ? `(World ${world})` : ''}. Follow the map star icon for this sign.
                  </Typography>
                  <Typography variant={'body2'} color={'text.secondary'}>
                    Need visuals? The wiki has the exact spot.
                  </Typography>
                  <Link href={wikiLink} target={'_blank'} rel={'noopener'} underline={'hover'}>
                    View wiki entry for {cleanUnderscore(name)}
                  </Link>
                </Stack>
              </Collapse>
            </Grid>
          </Grid>
          {constellationList.length - 1 !== index ? <Divider /> : null}
        </React.Fragment>
      })}
    </Stack>
  );
};

export default ConstellationsComp;
