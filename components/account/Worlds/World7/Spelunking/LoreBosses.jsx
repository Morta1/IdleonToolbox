import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum, gameLines, number2letter } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getAmberDenominator, getAmberIndex, MAX_GRAND_DISCOVERIES } from '@parsers/world-7/spelunking';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import InfoButton from '@components/common/InfoButton';

// The discoveries as the old page drew them, a row of sprites, not a block of 72 px tiles: 40 px tiles 4 px apart fit
// 6 to a row in a boss card at 1920, 1366 and on a phone, so 15 discoveries take 3 rows, not 5
const DISCOVERY_TILE = 40;
const DISCOVERY_GRID_SX = { gap: 0.5 };

const LoreBosses = ({ loreBosses, account }) => {
  const amberDenominator = getAmberDenominator(account);
  const amberIndex = getAmberIndex(account);
  const manicUnlocked = account?.spelunking?.manicUnlocked;
  const { depths = 0, manicDepths = 0 } = account?.spelunking?.saveTotals || {};
  // The game's amber line, as the haul's own print (Spelunk[2]): over the denominator, commas under 1e9, Big past it
  const amberText = (value) => formatGame((value ?? 0) / amberDenominator, 'Spelunk.AmberDenominator', { whole: true });

  const bossCard = (boss) => {
    const iconLetter = number2letter[boss.index];
    const hasAnyDiscovery = boss.discoveries?.some((discovery) => discovery?.acquired);
    const found = boss.grandDiscoveriesFound ?? 0;
    const grand = found >= MAX_GRAND_DISCOVERIES
      ? ['Grand discoveries', <StatusText key={'grand'} status={'maxed'}>{`${MAX_GRAND_DISCOVERIES} / ${MAX_GRAND_DISCOVERIES}`}</StatusText>]
      : boss.grandDiscoveryChance > 0 ? ['Grand discoveries', `${formatNum(found)} / ${MAX_GRAND_DISCOVERIES}`] : null;
    // "1 in N" is the odds kind and the game's own Comma line (GrandDiscoveries_FindChance). It rides after the percent
    // only under 50% ("88.3% (1 in 1)" said nothing more) and not for a chance that prints 0% (a guest's 1 in 25,000).
    const chance = boss.grandDiscoveryChance;
    const percent = formatNum(chance * 100, 'pct');
    const discovered = boss.discoveriesCount ?? 0;
    const discoveries = ['Discoveries', discovered >= boss.maxDiscoveries && discovered > 0
      ? <StatusText key={'discoveries'} status={'maxed'}>{`${formatNum(discovered)} / ${formatNum(boss.maxDiscoveries)}`}</StatusText>
      : `${formatNum(discovered)} / ${formatNum(boss.maxDiscoveries ?? 0)}`];
    const nextGrand = chance > 0 && found < MAX_GRAND_DISCOVERIES ? ['Next grand discovery',
      <Stack key={'next'} component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
        {chance < 0.5 && percent !== '0%' ? `${percent} (${formatNum(chance, 'odds')})` : percent}
        <InfoButton label={'Next grand discovery'}>Uses your highest Spelunking character and leaves out every elixir bonus.</InfoButton>
      </Stack>] : null;
    return <ItemCard key={boss.index} title={gameLines(boss.description).join(' ')} dimmed={!hasAnyDiscovery}
                     icon={<GameIcon src={`data/CaveBoss${boss.index}.png`} size={56} alt={''}
                                     status={boss.defeated ? undefined : 'missing'}/>}>
      <ItemCard.Facts rows={[
        ['Best', `Depth ${formatNum(boss.bestCaveLevel ?? 0)}`],
        manicUnlocked ? ['Best manic', `Depth ${formatNum(boss.bestManicCaveLevel ?? 0)}`] : null,
        ['Found at', `Depth ${formatNum(boss.foundAt ?? 0)}`],
        ['Biggest haul', <Stack key={'haul'} component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
          <GameIcon src={`data/CaveAmber${amberIndex}.png`} size={16} alt={'Amber'}/>{amberText(boss.biggestHaul)}</Stack>],
        discoveries,
        grand,
        nextGrand
      ]}/>
      <ItemCard.Section>
        <CardGrid size={'icon'} fill={DISCOVERY_TILE} sx={DISCOVERY_GRID_SX}>
          {boss.discoveries?.map((discovery) => {
            const name = cleanUnderscore(discovery?.name);
            // A discovery's sprite note, a tap away (the hover tooltip before)
            return <IconTile key={discovery?.index} icon={`data/CaveRock${iconLetter}${discovery?.index}.png`} alt={name}
                             height={DISCOVERY_TILE} iconSize={32} status={discovery?.acquired ? undefined : 'missing'}
                             details={discovery?.powerReqFormatted ? `${name}: needs ${discovery.powerReqFormatted} power.` : name}/>;
          })}
        </CardGrid>
      </ItemCard.Section>
    </ItemCard>;
  };

  return (
    <Stack gap={3}>
      {/* Decision 3: the tab's totals stay at its top */}
      <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        <StatTile label={'Total best depth'} value={depths} kind={'amount'}/>
        {manicUnlocked || manicDepths > 0
          ? <StatTile label={'Total best manic depth'} value={manicDepths} kind={'amount'}/>
          : null}
      </Stack>
      <CardGrid size={'m'}>
        {loreBosses?.map((boss) => (boss ? bossCard(boss) : null))}
      </CardGrid>
    </Stack>
  );
};

export default LoreBosses;
