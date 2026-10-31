import React from 'react';
import { Stack } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Tooltip from '@components/Tooltip';
import useCheckbox from '@components/common/useCheckbox';
import { LUMI_ICON, RankRequired } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

const NIGHTMARINER_UNLOCK = 13;

const UnlockTitle = ({ name, tooltip }) => {
  if (!tooltip) return name;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    {name}
    <Tooltip title={tooltip}>
      <InfoIcon sx={{ fontSize: 16 }}/>
    </Tooltip>
  </span>;
};

const Unlocks = ({ unlocks, menagerie }) => {
  const [CheckboxEl, hidePurchased] = useCheckbox('Hide purchased unlocks');
  const shownUnlocks = hidePurchased ? unlocks?.filter(({ owned }) => !owned) : unlocks;

  return <Stack gap={1}>
    <CheckboxEl/>
    <CardGrid size={'m'}>
      {shownUnlocks?.map(({ index, name, tooltip, cost, owned, visible, rankRequired }) => {
        const locked = !visible && !owned;
        return <ItemCard key={`unlock-${index}`}
                         icon={`data/MenaIconO${index}.png`}
                         iconSize={56}
                         title={<UnlockTitle name={name} tooltip={tooltip}/>}
                         status={owned ? 'active' : locked ? 'locked' : undefined}
                         statusLabel={owned ? 'Owned' : undefined}
                         footer={owned ? null : locked
                           ? <RankRequired rank={rankRequired}/>
                           : <ItemCard.Cost icon={LUMI_ICON} iconAlt={'Lumi'} need={cost} have={menagerie?.lumi ?? 0}/>}>
          {index === NIGHTMARINER_UNLOCK && owned
            ? <ItemCard.Facts rows={[['Nightmariner LVs over 600', menagerie?.nightmariner?.totalLevels ?? 0, 'amount']]}/>
            : null}
        </ItemCard>;
      })}
    </CardGrid>
  </Stack>;
};

export default Unlocks;
