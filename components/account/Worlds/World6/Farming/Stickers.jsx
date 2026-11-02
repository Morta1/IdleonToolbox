import { Stack } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import React, { useContext } from 'react';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Num from '@components/common/Num';

// The game's sentence: { is the bonus in its own Comma rule, } the multiplier it makes (the x is the sentence's)
const formatStickerDescription = (desc, bonus) => {
  if (!desc) return '';
  return cleanUnderscore(
    desc
      .split('{').join(formatGame(bonus, 'FarmingStuffs.StickerBonus'))
      .split('}').join(formatNum(1 + bonus / 100, 'mult', { bare: true }))
  );
};

// The game's own switch for a sticker's odds: commas under 10M, Big past it
const formatOdds = (odds) => (odds > 0 ? `1 in ${formatGame(Math.round(1 / odds), 'FarmingStuffs.StickerOdds')}` : '-');

const Stickers = () => {
  const { state } = useContext(AppContext);
  const { stickers = [], totalStickers = 0, dmgMulti = 1 } = state?.account?.farming || {};

  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={2}>
      <StatTile label={'Total Stickers'} value={totalStickers} kind={'amount'}/>
      {dmgMulti > 1
        ? <StatTile label={'DMG Multi'} value={<Num value={dmgMulti} game={'FarmingStuffs.StickerDMGmulti'} unit={'x'}/>}/>
        : null}
    </Stack>
    <CardGrid size={'s'}>
      {stickers.map(({ name, description, count, bonus, odds }, index) => (
        <ItemCard key={name} icon={`data/FarmStickerB${index}.png`} title={cleanUnderscore(name)} dimmed={!(count > 0)}>
          <ItemCard.Desc text={formatStickerDescription(description, bonus)}/>
          <ItemCard.Facts rows={[['Found', count ?? 0, 'amount'], ['Chance', formatOdds(odds)]]}/>
        </ItemCard>
      ))}
    </CardGrid>
  </>;
};

export default Stickers;
