import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

// Temporary fallback until the 2.3.511 gooey-shape sprites are extracted to public/data/HoleGshape*.png.
const FALLBACK_ICON = `${prefix}data/ClassIconsNA2.png`;
const onIconError = (e) => {
  if (e.target.src.endsWith('ClassIconsNA2.png')) return;
  e.target.src = FALLBACK_ICON;
};

const CrystalGlunkoCove = ({ hole }) => {
  const cove = hole?.caverns?.crystalGlunkoCove;
  if (!cove) return null;

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Drop Rate (in Cove)'} value={`${notateNumber(cove.dropRate, 'MultiplierInfo')}x`}/>
      <CardTitleAndValue title={'AFK Gains (in Cove)'} value={`${notateNumber(100 * cove.afkGains, 'Big')}%`}/>
      <CardTitleAndValue title={'Multikill Per Tier'} value={`${notateNumber(cove.multiKillTier, 'Big')}%`}/>
      <CardTitleAndValue title={'Base Multikill'} value={`${notateNumber(cove.multiKillBase, 'Big')}%`}/>
      <CardTitleAndValue title={'Faster Respawn'} value={`${notateNumber(cove.respawn, 'Big')}%`}/>
      <CardTitleAndValue title={'Double Pickup'} value={`${notateNumber(cove.doublePickup, 'Big')}x`}/>
      <CardTitleAndValue title={'Opals found'} icon={'data/Opal.png'} imgStyle={{ width: 24, height: 24 }}
                         value={hole?.holesObject?.opalsPerCavern?.[17] || 0}/>
    </Stack>

    <CardTitleAndValue title={'Gooey Shapes'} cardSx={{ mt: 2 }}>
      <Stack direction={'row'} gap={1.5} flexWrap={'wrap'}>
        {cove.shapes.map((shape) => (
          <Stack key={shape.name} alignItems={'center'} sx={{ width: 56 }}>
            <img src={`${prefix}data/${shape.name}.png`} onError={onIconError}
                 width={32} height={32} style={{ objectFit: 'contain' }} alt={shape.name}/>
            <Typography variant={'body2'} color={'text.secondary'}>
              {notateNumber(shape.owned, 'Big')}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </CardTitleAndValue>

    <UpgradeSection title={'Crystal Upgrades'}
                    upgrades={cove.upgrades.filter((upgrade) => upgrade.group === 'crystal')}/>
    <UpgradeSection title={'Jeweled Upgrades'}
                    upgrades={cove.upgrades.filter((upgrade) => upgrade.group === 'jeweled')}/>
  </>;
};

const UpgradeSection = ({ title, upgrades }) => {
  if (!upgrades?.length) return null;
  return <>
    <Typography variant={'h6'} sx={{ mt: 2 }}>{title}</Typography>
    <Box sx={{
      mt: 1,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 2,
      alignItems: 'stretch'
    }}>
      {upgrades.map((upgrade) => (
        <Card key={upgrade.index} sx={{ height: '100%', opacity: upgrade.unlocked ? (upgrade.level > 0 ? 1 : 0.7) : 0.5 }}>
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
              <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>
                {cleanUnderscore(upgrade.name)}
              </Typography>
              <Typography variant={'body2'} color={'text.secondary'}>
                Lv {upgrade.level}
              </Typography>
            </Stack>
            <Typography variant={'body1'} sx={{ display: 'block', mt: 0.5, lineHeight: 1.3 }}>
              {cleanUnderscore(upgrade.description)}
            </Typography>
            {upgrade.unlocked ?
              <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{ mt: 0.5 }}>
                <Typography variant={'body2'} color={'text.secondary'}>Cost:</Typography>
                <img src={`${prefix}data/${upgrade.shapeName}.png`} onError={onIconError}
                     width={20} height={20} style={{ objectFit: 'contain' }} alt={upgrade.shapeName}/>
                <Typography variant={'body2'} color={'text.secondary'}>
                  {notateNumber(upgrade.cost, 'Big')}
                </Typography>
              </Stack>
              :
              <Typography variant={'body2'} color={'text.secondary'} sx={{ mt: 0.5 }}>
                Locked - find a{' '}
                <img src={`${prefix}data/${upgrade.shapeName}.png`} onError={onIconError}
                     width={16} height={16}
                     style={{ objectFit: 'contain', verticalAlign: 'text-bottom', margin: '0 2px' }}
                     alt={upgrade.shapeName}/>
                {cleanUnderscore(upgrade.requirement)}
              </Typography>}
          </CardContent>
        </Card>
      ))}
    </Box>
  </>;
};

export default CrystalGlunkoCove;
