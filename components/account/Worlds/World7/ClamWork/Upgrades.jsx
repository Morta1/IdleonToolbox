import React from 'react';
import { Stack, Typography } from '@mui/material';
import { IconLock } from '@tabler/icons-react';
import { cleanUnderscore, titleCaseName } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// A locked card's one footer line (Notices board): a lock and what it needs, with the upgrade's cost kept at its end.
const LockedFooter = ({ required, cost }) => <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1} flexWrap={'wrap'}>
  <Typography variant={'body2'} color={'text.secondary'} component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
    <IconLock size={16} aria-hidden/>
    {`Needs ${formatGame(required, 'Thingies.Clam_PearlUpgReq')} pearls`}
  </Typography>
  {cost > 0 ? <ItemCard.Cost icon={'data/ClamPearl0.png'} iconAlt={'Pearls'} need={cost} game={'Thingies.Clam_Cost'}/> : null}
</Stack>;

// The clam upgrades have no art of their own; the pearl is the cost's
const Upgrades = ({ upgrades, ownedPearls }) => <CardGrid size={'m'}>
  {upgrades?.map((upgrade, index) => {
    const needsPearls = !upgrade?.unlocked && index > 0 && upgrade?.requiredPearls > 0;
    return <ItemCard key={upgrade?.name || index} title={titleCaseName(cleanUnderscore(upgrade?.name))}
                     level={{ value: upgrade?.level ?? 0 }}
                     status={upgrade?.unlocked ? undefined : 'locked'}
                     footer={needsPearls ? <LockedFooter required={upgrade.requiredPearls} cost={upgrade?.cost}/>
                       : upgrade?.cost > 0
                         ? <ItemCard.Cost icon={'data/ClamPearl0.png'} iconAlt={'Pearls'} need={upgrade.cost} have={ownedPearls}
                                          game={'Thingies.Clam_Cost'}/>
                         : null}>
      {upgrade?.description ? <ItemCard.Desc text={upgrade.description}/> : null}
    </ItemCard>;
  })}
</CardGrid>;

export default Upgrades;
