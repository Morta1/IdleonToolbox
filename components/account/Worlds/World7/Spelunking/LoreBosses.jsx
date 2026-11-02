import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum, number2letter } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getAmberDenominator, getAmberIndex, MAX_GRAND_DISCOVERIES } from '@parsers/world-7/spelunking';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import InfoButton from '@components/common/InfoButton';

const LoreBosses = ({ loreBosses, account }) => {
  const amberDenominator = getAmberDenominator(account);
  const amberIndex = getAmberIndex(account);
  const manicUnlocked = account?.spelunking?.manicUnlocked;
  const { depths = 0, manicDepths = 0 } = account?.spelunking?.saveTotals || {};
  // The game's amber line, as the haul's own print (Spelunk[2]): over the denominator, commas under 1e9, Big past it
  const amberText = (value) => formatGame((value ?? 0) / amberDenominator, 'Spelunk.AmberDenominator');

  const bossCard = (boss) => {
    const iconLetter = number2letter[boss.index];
    const hasAnyDiscovery = boss.discoveries?.some((discovery) => discovery?.acquired);
    const found = boss.grandDiscoveriesFound ?? 0;
    const grand = found >= MAX_GRAND_DISCOVERIES
      ? ['Grand discoveries', <StatusText key={'grand'} status={'maxed'}>{`${MAX_GRAND_DISCOVERIES} / ${MAX_GRAND_DISCOVERIES}`}</StatusText>]
      : boss.grandDiscoveryChance > 0 ? ['Grand discoveries', `${formatNum(found)} / ${MAX_GRAND_DISCOVERIES}`] : null;
    // "1 in N" is the odds kind and the game's own Comma line (GrandDiscoveries_FindChance)
    const nextGrand = boss.grandDiscoveryChance > 0 && found < MAX_GRAND_DISCOVERIES ? ['Next grand discovery',
      <Stack key={'next'} component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
        {`${formatNum(boss.grandDiscoveryChance * 100, 'pct')} (${formatNum(boss.grandDiscoveryChance, 'odds')})`}
        <InfoButton label={'Next grand discovery'}>Uses your highest Spelunking character and leaves out every elixir bonus.</InfoButton>
      </Stack>] : null;
    return <ItemCard key={boss.index} title={cleanUnderscore(boss.description)} dimmed={!hasAnyDiscovery}
                     icon={<GameIcon src={`data/CaveBoss${boss.index}.png`} size={56} alt={''}
                                     status={boss.defeated ? undefined : 'missing'}/>}>
      <ItemCard.Facts rows={[
        ['Best', `Depth ${formatNum(boss.bestCaveLevel ?? 0)}`],
        manicUnlocked ? ['Best manic', `Depth ${formatNum(boss.bestManicCaveLevel ?? 0)}`] : null,
        ['Found at', `Depth ${formatNum(boss.foundAt ?? 0)}`],
        ['Biggest haul', <Stack key={'haul'} component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
          <GameIcon src={`data/CaveAmber${amberIndex}.png`} size={16} alt={'Amber'}/>{amberText(boss.biggestHaul)}</Stack>],
        grand,
        nextGrand
      ]}/>
      <ItemCard.Section label={'Discoveries'}>
        <ItemCard.Progress label={'Found'} value={boss.discoveriesCount ?? 0} max={boss.maxDiscoveries ?? 0}/>
        <CardGrid size={'icon'}>
          {boss.discoveries?.map((discovery) => {
            const name = cleanUnderscore(discovery?.name);
            // A discovery's sprite note, a tap away (the hover tooltip before)
            return <IconTile key={discovery?.index} icon={`data/CaveRock${iconLetter}${discovery?.index}.png`} alt={name}
                             status={discovery?.acquired ? undefined : 'missing'}
                             details={discovery?.powerReqFormatted ? `${name}: needs ${discovery.powerReqFormatted} power.` : name}/>;
          })}
        </CardGrid>
      </ItemCard.Section>
    </ItemCard>;
  };

  return (
    <Stack gap={3}>
      {/* Decision 3: the tab's totals stay at its top */}
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
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
