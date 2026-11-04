import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { DAY_MARKET_SIZE, sumMarketLevels } from '@parsers/world-6/farming';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { formatGame } from '@utility/gameNotation';

const Market = ({ market, crop }) => {
  return (<>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1} mb={2}>
      <StatTile label={'Total day market levels'} value={formatNum(sumMarketLevels(market?.slice(0, DAY_MARKET_SIZE)))}/>
      <StatTile label={'Total night market levels'}
                value={formatNum(sumMarketLevels(market?.slice(DAY_MARKET_SIZE, DAY_MARKET_SIZE * 2)))}/>
    </Stack>
    <CardGrid size={'m'}>
      {market?.map(({ name, level, maxLvl, bonus, value, baseValue, costToMax, type, cost, nextUpgrades }, marketIndex) => {
        // The day market pays in its own crops, the night market in beans; a night upgrade lists only its next step
        const isDay = marketIndex < DAY_MARKET_SIZE;
        const costIcon = (nextType) => `data/${isDay ? `FarmCrop${nextType}` : 'FarmCropBean'}.png`;
        const ownedOf = (nextType) => Math.max(0, crop?.[isDay ? nextType : 'beans'] ?? 0);
        const later = (level < maxLvl
          ? nextUpgrades?.filter(({ type: nextType, cost: nextCost }) => !(nextType === type && nextCost === cost))
          : nextUpgrades) ?? [];
        const shown = isDay ? later : later.slice(0, 1);
        // { is a percent and } a multiplier, the sentence carrying the % or x. The game fills both with
        // Math.round(100 * x) / 100, which FarmingStuffs.BasketUpgQTY's stored rule does not hold (it prints 2.26 as 2.3)
        const amount = isDay ? value : baseValue;
        const bonusText = cleanUnderscore(bonus.replace(/{/g, formatNum(amount, 'pct', { precise: true, bare: true }))
          .replace(/}/g, formatNum(amount, 'mult', { bare: true })));
        // The next cost leads, named, then the later steps: as a footer it sat unlabelled under them
        return <ItemCard key={'upgrade' + marketIndex} title={cleanUnderscore(name.toLowerCase().capitalizeAll())}
                         level={{ value: level, max: maxLvl }} meta={isDay ? 'Day market' : 'Night market'}
                         status={level >= maxLvl ? 'maxed' : undefined}>
          <ItemCard.Desc text={bonusText}/>
          {level < maxLvl ? <ItemCard.Section label={'Next cost'}>
            <ItemCard.Cost icon={costIcon(type)} need={Math.floor(cost)} have={ownedOf(type)}
                           game={'FarmingStuffs.MarketCostQTY'}/>
          </ItemCard.Section> : null}
          {shown.length ? <ItemCard.Section label={level >= maxLvl ? 'Future requirements (needs more research)' : 'Future requirements'}>
            {shown.map(({ type: nextType, cost: nextCost }, step) => <ItemCard.Cost key={step} icon={costIcon(nextType)}
                                                                                    need={Math.floor(nextCost)}
                                                                                    have={ownedOf(nextType)}
                                                                                    game={'FarmingStuffs.MarketCostQTY'}/>)}
          </ItemCard.Section> : null}
          {costToMax > 0 ? <ItemCard.Facts rows={[['Cost to max', formatGame(costToMax, 'FarmingStuffs.MarketCostQTY')]]}/> : null}
        </ItemCard>;
      })}
    </CardGrid>
  </>);
};

export default Market;
