import React, { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { IconChevronRight } from '@tabler/icons-react';
import { cleanUnderscore } from 'utility/helpers';
import GameIcon from '@components/common/GameIcon';
import ShortAmount from '@components/common/ShortAmount';
import StatusText from '@components/common/StatusText';
import ItemTooltip from './ItemTooltip';

const slotName = (subType) => subType ? cleanUnderscore(subType.charAt(0) + subType.slice(1).toLowerCase()) : '';
const TIER_LABEL = { covered: 'covered', owned: 'owned', missing: 'not owned', goal: 'tracked' };
const SHOWN_SHORTFALLS = 2;

const ChainStatus = ({ next, shortFor }) => {
  if (!shortFor.length) {
    return <StatusText status={'ready'} wrap>Ready to craft {cleanUnderscore(next)}</StatusText>;
  }
  const hidden = shortFor.length - SHOWN_SHORTFALLS;
  return <StatusText status={'problem'} wrap>
    <span>
      {shortFor.slice(0, SHOWN_SHORTFALLS).map(({ itemName, short }, index) => <React.Fragment key={itemName}>
        {index ? ' · ' : null}
        <span>{cleanUnderscore(itemName)} ×<ShortAmount amount={short}/></span>
      </React.Fragment>)}
      {hidden > 0 ? ` · +${hidden} more` : null}
    </span>
  </StatusText>;
};

// Where a tier stands, in its note and its alt. unknown: a failed storage section can't say, so neither does the note.
const TierNote = ({ state, ownedTier }) => {
  if (state === 'covered') return <StatusText status={'done'} wrap>Covered by {cleanUnderscore(ownedTier)}</StatusText>;
  if (state === 'owned') return <StatusText status={'done'}>Owned</StatusText>;
  if (state === 'goal') return <StatusText status={'info'}>Tracked item</StatusText>;
  return 'Not owned';
};

const Tier = ({ itemName, rawName, state, ownedTier, unknown }) => <ItemTooltip rawName={rawName}
                                                                               note={unknown ? null : <TierNote state={state} ownedTier={ownedTier}/>}>
  <GameIcon src={`data/${rawName}.png`} size={40} status={!unknown && state === 'covered' ? 'missing' : undefined}
            alt={unknown ? cleanUnderscore(itemName) : `${cleanUnderscore(itemName)}, ${TIER_LABEL[state]}`}/>
</ItemTooltip>;

// Tiers below the owned one are history for most players, so the ladder starts at the owned tier;
// the earlier ones stay one click away for anyone checking the crafting order.
const ChainRow = ({ chain, first, unknown }) => {
  const [showEarlier, setShowEarlier] = useState(false);
  const ownedTier = chain.tiers.find(({ state }) => state === 'owned')?.itemName;
  const coveredCount = chain.tiers.filter(({ state }) => state === 'covered').length;
  const tiers = showEarlier || unknown ? chain.tiers : chain.tiers.filter(({ state }) => state !== 'covered');
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
      <Typography variant={'value'} component={'div'}>{cleanUnderscore(chain.goal)}</Typography>
      <Typography variant={'caption'} color={'text.muted'}>{slotName(chain.subType)}</Typography>
    </Stack>
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
      {tiers.map((tier, tierIndex) => <React.Fragment key={tier.itemName}>
        {tierIndex ? <Box component={'span'} aria-hidden sx={{ display: 'inline-flex', color: 'text.muted' }}>
          <IconChevronRight size={14}/>
        </Box> : null}
        <Tier {...tier} ownedTier={ownedTier} unknown={unknown}/>
      </React.Fragment>)}
      {coveredCount && !unknown ? <Button size={'small'} onClick={() => setShowEarlier(!showEarlier)} aria-expanded={showEarlier}
                              sx={{ ml: 0.5, minHeight: { xs: 44, sm: 32 }, color: 'text.secondary' }}>
        {showEarlier ? `Hide ${coveredCount} earlier ${tierWord}` : `Show ${coveredCount} earlier ${tierWord}`}
      </Button> : null}
    </Box>
    {unknown ? null : <Box>
      <ChainStatus {...chain}/>
    </Box>}
  </Box>;
};

const UpgradeChains = ({ chains, unknown }) => <Stack>
  {chains.map((chain, index) => <ChainRow key={`${chain.goal}-${index}`} chain={chain} first={index === 0} unknown={unknown}/>)}
</Stack>;

export default UpgradeChains;
