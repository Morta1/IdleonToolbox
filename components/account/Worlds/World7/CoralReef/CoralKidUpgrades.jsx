import React, { useContext } from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import { AppContext } from '@components/common/context/AppProvider';
import { CardTitleAndValue } from '@components/common/styles';
import { isMenagerieUnlockOwned } from '@parsers/world-7/menagerie';

// Menagerie unlock 2 opens Singularity Mode, the second page of Coral Kid upgrades
const SINGULARITY_MENAGERIE_UNLOCK = 2;

const UpgradeGrid = ({ upgrades, locked }) => {
  return <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
    {upgrades.map((upgrade) => (
      <Card key={upgrade.index} variant={'outlined'}
            sx={{ opacity: !locked && upgrade.level > 0 ? 1 : 0.6, height: '100%' }}>
        <CardContent>
          <Stack spacing={1.5}>
            {upgrade.description ? <Typography variant="body2">
              {cleanUnderscore(upgrade.description)}
            </Typography> : null}
            <Divider sx={{ my: 0.5 }}/>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="body2" color="text.secondary" component="span">Level:</Typography>
              <Typography variant="body2" component="span">{upgrade.level || 0}</Typography>
            </Stack>
            {upgrade.cost !== undefined ? <>
              <Divider sx={{ my: 0.5 }}/>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="body2" color="text.secondary" component="span">Cost:</Typography>
                <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                  {upgrade.costItem ? <img src={`${prefix}data/${upgrade.costItem}.png`}
                                           alt={'Singularity Spiral'}
                                           style={{ width: 20, height: 20, objectFit: 'contain' }}/> : null}
                  <Typography variant="body2" component="span">
                    {1e6 > upgrade.cost ? commaNotation(Math.ceil(upgrade.cost)) : notateNumber(upgrade.cost, 'Big')}
                  </Typography>
                </Stack>
              </Stack>
            </> : null}
          </Stack>
        </CardContent>
      </Card>
    ))}
  </Box>;
};

const CoralKidUpgrades = ({ coralKidUpgrades }) => {
  const { state } = useContext(AppContext);
  const totalLevels = state?.account?.coralReef?.coralKidUpgradeLevelTotal ?? 0;
  if (!coralKidUpgrades || coralKidUpgrades.length === 0) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>Coral Kid Upgrades</Typography>
        <Typography variant="body2" color="text.secondary">No coral kid upgrades available</Typography>
      </Box>
    );
  }

  const firstPage = Math.min(...coralKidUpgrades.map(({ page }) => page ?? 0));
  const pageOne = coralKidUpgrades.filter(({ page }) => (page ?? 0) === firstPage);
  const pageTwo = coralKidUpgrades.filter(({ page }) => (page ?? 0) !== firstPage);
  const singularityUnlocked = isMenagerieUnlockOwned(state?.account, SINGULARITY_MENAGERIE_UNLOCK);

  return (
    <Box>
      <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
        <CardTitleAndValue title={'Total Upgrade LV'} value={commaNotation(totalLevels)}/>
      </Stack>
      <UpgradeGrid upgrades={pageOne}/>
      {pageTwo.length > 0 ? <>
        <Stack direction={'row'} alignItems={'center'} gap={1} mt={4} mb={2}>
          <img src={`${prefix}data/CKsing.png`} alt={''} style={{ width: 28, height: 28, objectFit: 'contain' }}/>
          <Typography variant={'h6'}>Singularity Mode</Typography>
        </Stack>
        {!singularityUnlocked ? <Typography variant={'body2'} color={'text.secondary'} mb={2}>
          Unlocked from the Luminous Menagerie.
        </Typography> : null}
        <UpgradeGrid upgrades={pageTwo} locked={!singularityUnlocked}/>
      </> : null}
    </Box>
  );
};

export default CoralKidUpgrades;
