import React from 'react';
import { Box } from '@mui/material';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { LUMI_ICON, RankRequired } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

const NIGHTMARINER_UNLOCK = 13;
const UNLOCKS_TOOLBAR = { hidePurchased: false };

const Unlocks = ({ unlocks, menagerie }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('menagerie-unlocks', UNLOCKS_TOOLBAR);
  const shownUnlocks = toolbar?.hidePurchased ? unlocks?.filter(({ owned }) => !owned) : unlocks;

  return <Box>
    <Toolbar state={toolbar} defaults={UNLOCKS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={unlocks?.length ?? 0} shown={shownUnlocks?.length ?? 0} noun={'unlocks'}>
      <Toolbar.Filter name={'hidePurchased'} label={'Hide purchased'}/>
    </Toolbar>
    <CardGrid size={'m'}>
      {shownUnlocks?.map(({ index, name, tooltip, cost, owned, visible, rankRequired }) => {
        const locked = !visible && !owned;
        return <ItemCard key={`unlock-${index}`}
                         icon={`data/MenaIconO${index}.png`}
                         iconSize={56}
                         title={name}
                         status={owned ? 'done' : locked ? 'locked' : undefined}
                         statusLabel={owned ? 'Owned' : undefined}
                         footer={owned ? null : locked
                           ? <RankRequired rank={rankRequired}/>
                           : <ItemCard.Cost icon={LUMI_ICON} iconAlt={'Lumi'} need={cost} have={menagerie?.lumi ?? 0}
                                            game={'MenagerieStuff.Cost'}/>}>
          {/* The unlock's explanation, visible on the card (a hover note on its title before) */}
          {tooltip ? <ItemCard.Desc>{tooltip}</ItemCard.Desc> : null}
          {index === NIGHTMARINER_UNLOCK && owned
            ? <ItemCard.Facts rows={[['Nightmariner LVs over 600', menagerie?.nightmariner?.totalLevels ?? 0, 'amount']]}/>
            : null}
        </ItemCard>;
      })}
    </CardGrid>
  </Box>;
};

export default Unlocks;
