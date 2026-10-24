import React, { useContext } from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, commaOrBig, notateNumber, prefix } from '@utility/helpers';
import { AppContext } from '@components/common/context/AppProvider';
import { CardTitleAndValue } from '@components/common/styles';
import { isMenagerieUnlockOwned } from '@parsers/world-7/menagerie';
import { calcTotalItemOwned } from '@parsers/storage';
import { getTotalDivinityLevel } from '@parsers/world-5/divinity';

// Menagerie unlock 2 opens Singularity Mode, the second page of Coral Kid upgrades
const SINGULARITY_MENAGERIE_UNLOCK = 2;
const SINGULARITY_SPIRAL = 'CKsing';

const formatAmount = (value) => commaOrBig(value, Math.ceil);
const formatMulti = (value) => 100 > value
  ? `${notateNumber(value, 'MultiplierInfo').replace('#', '')}x`
  : `${commaNotation(value)}x`;

const Row = ({ label, children }) => <Stack direction="row" alignItems="center" justifyContent="space-between"
                                             flexWrap="wrap" gap={1}>
  <Typography variant="body2" color="text.secondary" component="span">{label}</Typography>
  {children}
</Stack>;

const UpgradeGrid = ({ upgrades, locked, totalDivinityLevel }) => {
  return <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
    {upgrades.map((upgrade) => {
      const gateMet = totalDivinityLevel >= (upgrade.divinityLevelReq ?? 0);
      return <Card key={upgrade.index} variant={'outlined'}
                   sx={{ opacity: !locked && upgrade.level > 0 ? 1 : 0.6, height: '100%' }}>
        <CardContent>
          <Stack spacing={1.5}>
            {upgrade.description ? <Typography variant="body2">
              {cleanUnderscore(upgrade.description)}
            </Typography> : null}
            <Divider sx={{ my: 0.5 }}/>
            <Row label={'Level:'}>
              <Typography variant="body2" component="span">{upgrade.level || 0}</Typography>
            </Row>
            {upgrade.divinityLevelReq > 0 ? <Row label={'Requires Total Divinity LV:'}>
              <Typography variant="body2" component="span" color={gateMet ? 'text.primary' : 'error.light'}>
                {commaNotation(upgrade.divinityLevelReq)}
              </Typography>
            </Row> : null}
            {upgrade.cost !== undefined ? <>
              <Divider sx={{ my: 0.5 }}/>
              <Row label={'Cost:'}>
                <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                  {upgrade.costItem ? <img src={`${prefix}data/${upgrade.costItem}.png`}
                                           alt={'Singularity Spiral'}
                                           style={{ width: 20, height: 20, objectFit: 'contain' }}/> : null}
                  <Typography variant="body2" component="span">{formatAmount(upgrade.cost)}</Typography>
                </Stack>
              </Row>
            </> : null}
          </Stack>
        </CardContent>
      </Card>;
    })}
  </Box>;
};

// The Singularity panel's conversion: Divinity PTS, kills and AFK hours into Singularity Spirals
const Singularity = ({ singularity, spiralsOwned }) => {
  const { points, kills, hours, baseValue, killMulti, timeMulti, totalValue } = singularity ?? {};
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={2}>
    <CardTitleAndValue title={'Singularity Spirals'} icon={`data/${SINGULARITY_SPIRAL}.png`}
                       imgStyle={{ width: 24, height: 24 }} value={formatAmount(spiralsOwned ?? 0)}/>
    <CardTitleAndValue title={'Divinity PTS'} value={`${formatAmount(points ?? 0)} (${formatAmount(baseValue ?? 0)} base)`}/>
    <CardTitleAndValue title={'Kills'} value={`${formatAmount(kills ?? 0)} (${formatMulti(killMulti ?? 1)})`}/>
    <CardTitleAndValue title={'Hours'} value={`${formatAmount(hours ?? 0)} (${formatMulti(timeMulti ?? 0)})`}/>
    <CardTitleAndValue title={'Spirals on claim'} icon={`data/${SINGULARITY_SPIRAL}.png`}
                       imgStyle={{ width: 24, height: 24 }} value={formatAmount(Math.floor(totalValue ?? 0))}/>
  </Stack>;
};

const CoralKidUpgrades = ({ coralKidUpgrades }) => {
  const { state } = useContext(AppContext);
  const totalLevels = state?.account?.coralReef?.coralKidUpgradeLevelTotal ?? 0;
  // The gates read the Total Divinity LV across all players
  const totalDivinityLevel = getTotalDivinityLevel(state?.characters);
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
        <CardTitleAndValue title={'Total Divinity LV'} value={commaNotation(totalDivinityLevel)}/>
      </Stack>
      <UpgradeGrid upgrades={pageOne} totalDivinityLevel={totalDivinityLevel}/>
      {pageTwo.length > 0 ? <>
        <Stack direction={'row'} alignItems={'center'} gap={1} mt={4} mb={2}>
          <img src={`${prefix}data/${SINGULARITY_SPIRAL}.png`} alt={''} style={{ width: 28, height: 28, objectFit: 'contain' }}/>
          <Typography variant={'h6'}>Singularity Mode</Typography>
        </Stack>
        {!singularityUnlocked ? <Typography variant={'body2'} color={'text.secondary'} mb={2}>
          Unlocked from the Luminous Menagerie.
        </Typography> : <Singularity singularity={state?.account?.coralReef?.singularity}
                                     spiralsOwned={calcTotalItemOwned(state?.account?.storage, state?.characters, SINGULARITY_SPIRAL)}/>}
        <UpgradeGrid upgrades={pageTwo} locked={!singularityUnlocked} totalDivinityLevel={totalDivinityLevel}/>
      </> : null}
    </Box>
  );
};

export default CoralKidUpgrades;
