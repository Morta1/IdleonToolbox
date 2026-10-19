import React, { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';
import { cleanUnderscore, prefix } from 'utility/helpers';
import ShortAmount from '@components/common/ShortAmount';
import { StatusText } from './MaterialList';
import ItemTooltip from './ItemTooltip';

const slotName = (subType) => subType ? cleanUnderscore(subType.charAt(0) + subType.slice(1).toLowerCase()) : '';
const TIER_LABEL = { covered: 'covered', owned: 'owned', missing: 'not owned', goal: 'tracked' };
const SHOWN_SHORTFALLS = 2;

const ChainStatus = ({ next, shortFor }) => {
  if (!shortFor.length) {
    return <StatusText tone={'ready'} wrap>Ready to craft {cleanUnderscore(next)}</StatusText>;
  }
  const hidden = shortFor.length - SHOWN_SHORTFALLS;
  return <StatusText tone={'short'} wrap>
    <span>
      {shortFor.slice(0, SHOWN_SHORTFALLS).map(({ itemName, short }, index) => <React.Fragment key={itemName}>
        {index ? ' · ' : null}
        <span>{cleanUnderscore(itemName)} ×<ShortAmount amount={short}/></span>
      </React.Fragment>)}
      {hidden > 0 ? ` · +${hidden} more` : null}
    </span>
  </StatusText>;
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

// Tiers below the owned one are history for most players, so the ladder starts at the owned tier;
// the earlier ones stay one click away for anyone checking the crafting order.
const ChainRow = ({ chain, first }) => {
  const [showEarlier, setShowEarlier] = useState(false);
  const ownedTier = chain.tiers.find(({ state }) => state === 'owned')?.itemName;
  const coveredCount = chain.tiers.filter(({ state }) => state === 'covered').length;
  const tiers = showEarlier ? chain.tiers : chain.tiers.filter(({ state }) => state !== 'covered');
  const tierWord = coveredCount === 1 ? 'tier' : 'tiers';

  return <Box sx={{
    display: 'grid',
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '170px minmax(0, 1fr) minmax(170px, 260px)' },
    alignItems: 'center',
    columnGap: 2,
    rowGap: 1,
    py: 1.5,
    px: { xs: 0, md: 1.5 },
    borderTop: first ? 0 : 1,
    borderColor: 'divider'
  }}>
    <Stack sx={{ minWidth: 0 }}>
      <Typography variant={'body2'} fontWeight={500}>{cleanUnderscore(chain.goal)}</Typography>
      <Typography variant={'caption'} color={'text.disabled'}>{slotName(chain.subType)}</Typography>
    </Stack>
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
      {tiers.map((tier, tierIndex) => <React.Fragment key={tier.itemName}>
        {tierIndex ? <Box component={'span'} aria-hidden sx={{ display: 'inline-flex', color: 'text.disabled' }}>
          <IconChevronRight size={14}/>
        </Box> : null}
        <Tier {...tier} ownedTier={ownedTier}/>
      </React.Fragment>)}
      {coveredCount ? <Button size={'small'} onClick={() => setShowEarlier(!showEarlier)} aria-expanded={showEarlier}
                              sx={{ ml: 0.5, minHeight: { xs: 44, sm: 32 }, color: 'text.secondary' }}>
        {showEarlier ? `Hide ${coveredCount} earlier ${tierWord}` : `Show ${coveredCount} earlier ${tierWord}`}
      </Button> : null}
    </Box>
    <Box>
      <ChainStatus {...chain}/>
    </Box>
  </Box>;
};

const UpgradeChains = ({ chains }) => <Stack>
  {chains.map((chain, index) => <ChainRow key={`${chain.goal}-${index}`} chain={chain} first={index === 0}/>)}
</Stack>;

export default UpgradeChains;
