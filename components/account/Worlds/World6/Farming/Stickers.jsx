import { Box, Stack } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum, titleCaseName } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import React, { Fragment, useContext } from 'react';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Num from '@components/common/Num';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';

// The game's sentence: { is the bonus in its own Comma rule, } the multiplier it makes (the x is the sentence's)
const formatStickerDescription = (desc, bonus) => {
  if (!desc) return '';
  return cleanUnderscore(
    desc
      .split('{').join(formatGame(bonus, 'FarmingStuffs.StickerBonus'))
      .split('}').join(formatNum(1 + bonus / 100, 'mult', { bare: true }))
  );
};

// A plot rolls its seed's sticker on each OG gain, at the base odds x 2^(new OG): the best plot is read at its OG + 1.
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
      {stickers.map(({ index, name, description, count, bonus, odds, oddsBreakdown, seed, plantedPlots = 0, blockedPlots = 0, bestPlotOdds = 0 }) => {
        const seedIcon = seed?.name === 'MEDAL' ? 'data/FarmCrop230.png' : `etc/Seed_${seed?.seedId ?? index}.png`;
        const seedName = seed?.name ? titleCaseName(seed.name) : '-';
        const bestPlot = plantedPlots === 0 ? 'None planted'
          : plantedPlots === blockedPlots ? 'All blocked'
            : formatOdds(bestPlotOdds);
        // The blocked plots are about the plots, not the sticker: the card's foot, under its line, as other pages' footers
        return <ItemCard key={name} icon={`data/FarmStickerB${index}.png`} title={cleanUnderscore(name)} dimmed={!(count > 0)}
                         footer={blockedPlots > 0
                           ? <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                             <StatusText status={'needs'}>
                               {`${formatNum(blockedPlots)} ${blockedPlots === 1 ? 'plot' : 'plots'} blocked`}
                             </StatusText>
                             <InfoButton label={'Blocked plots'}>A plot holding a megacrop you haven't collected can't find
                               stickers. Collect it to start rolling again.</InfoButton>
                           </Box>
                           : null}>
          <ItemCard.Desc text={formatStickerDescription(description, bonus)}/>
          <ItemCard.Facts rows={[
            ['Seed', <Box key={'seed'} component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <GameIcon src={seedIcon} size={20} alt={''}/>{seedName}
            </Box>],
            ['Found', count ?? 0, 'amount'],
            [<Fragment key={'base'}>Base odds <InfoButton label={'Base odds'}>A plot planted with this seed rolls for this
              sticker each time it gains an OG level, at these odds doubled for every OG level it has. Best plot is your
              planted plot with the best roll on its next OG level.</InfoButton></Fragment>,
              <Breakdown key={'chance'} asValue data={{ ...oddsBreakdown, totalValue: formatOdds(odds) }}>{formatOdds(odds)}</Breakdown>],
            ['Best plot', bestPlot]
          ]}/>
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default Stickers;
