import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';
import { cleanUnderscore, prefix } from 'utility/helpers';
import { StatusText } from './MaterialList';
import ItemTooltip from './ItemTooltip';

const slotName = (subType) => subType ? cleanUnderscore(subType.charAt(0) + subType.slice(1).toLowerCase()) : '';
const TIER_LABEL = { covered: 'covered', owned: 'owned', missing: 'not owned', goal: 'tracked' };

const chainStatus = ({ next, shortFor }) => {
  if (!shortFor.length) return { tone: 'ready', text: `Ready to craft ${cleanUnderscore(next)}` };
  if (shortFor.length === 1) return { tone: 'short', text: `Needs ${cleanUnderscore(shortFor[0])}` };
  return { tone: 'short', text: `Needs ${shortFor.length} materials` };
};

const tierNote = (state, ownedTier) => {
  if (state === 'covered') return `Covered by ${cleanUnderscore(ownedTier)}`;
  if (state === 'owned') return 'Owned';
  if (state === 'goal') return 'Tracked item';
  return 'Not owned';
};

const Tier = ({ itemName, rawName, state, ownedTier }) => <ItemTooltip rawName={rawName}
                                                                      note={tierNote(state, ownedTier)}><Box
  component={'span'}
  sx={{
    position: 'relative',
    width: { xs: 40, sm: 44 },
    height: { xs: 40, sm: 44 },
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    ...(state === 'owned' && { boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.success.light}` }),
    ...(state === 'goal' && { boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.multi}` })
  }}>
  <Box component={'img'} src={`${prefix}data/${rawName}.png`} alt={`${cleanUnderscore(itemName)}, ${TIER_LABEL[state]}`}
       sx={{ width: '78%', height: '78%', objectFit: 'contain', opacity: state === 'covered' ? 0.35 : 1 }}/>
  {state === 'owned' ? <Box component={'span'} aria-hidden sx={{
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: '50%',
    bgcolor: 'background.paper',
    color: 'success.light',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}><IconCheck size={12} stroke={3}/></Box> : null}
</Box></ItemTooltip>;

const LegendSwatch = ({ color }) => <Box component={'span'} sx={{
  width: 12,
  height: 12,
  borderRadius: 0.75,
  boxShadow: (theme) => `inset 0 0 0 1px ${color(theme)}`
}}/>;

const UpgradeChains = ({ chains }) => <Stack>
  {chains.map((chain, index) => {
    const status = chainStatus(chain);
    const ownedTier = chain.tiers.find(({ state }) => state === 'owned')?.itemName;
    return <Box key={`${chain.goal}-${index}`} sx={{
      display: 'grid',
      gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: '72px minmax(0, 1fr) minmax(150px, 220px)' },
      alignItems: 'center',
      columnGap: 2,
      rowGap: 1,
      py: 1.5,
      px: { xs: 0, md: 1.5 },
      borderTop: index ? 1 : 0,
      borderColor: 'divider'
    }}>
      <Typography variant={'body2'} color={'text.secondary'} fontWeight={500}>{slotName(chain.subType)}</Typography>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        // Ladders run up to 11 tiers (bows), so they wrap instead of running past the card
        flexWrap: 'wrap',
        gap: 0.5,
        gridColumn: { xs: '1 / 3', md: 'auto' },
        gridRow: { xs: 2, md: 'auto' }
      }}>
        {chain.tiers.map((tier, tierIndex) => <React.Fragment key={tier.itemName}>
          {tierIndex ? <Box component={'span'} aria-hidden sx={{ display: 'inline-flex', color: 'text.disabled' }}>
            <IconChevronRight size={14}/>
          </Box> : null}
          <Tier {...tier} ownedTier={ownedTier}/>
        </React.Fragment>)}
      </Box>
      <Box sx={{ gridColumn: { xs: 2, md: 'auto' }, gridRow: { xs: 1, md: 'auto' }, justifySelf: { xs: 'end', md: 'start' }, textAlign: { xs: 'right', md: 'left' } }}>
        <StatusText tone={status.tone} wrap>{status.text}</StatusText>
      </Box>
    </Box>;
  })}
  <Stack direction={{ xs: 'column', sm: 'row' }} gap={{ xs: 0.5, sm: 2 }} sx={{ px: { xs: 0, md: 1.5 }, pt: 0.5 }}>
    <Typography variant={'caption'} color={'text.disabled'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <LegendSwatch color={(theme) => theme.palette.success.light}/>Owned: covers every tier to its left
    </Typography>
    <Typography variant={'caption'} color={'text.disabled'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <LegendSwatch color={(theme) => theme.palette.multi}/>Tracked item
    </Typography>
  </Stack>
</Stack>;

export default UpgradeChains;
