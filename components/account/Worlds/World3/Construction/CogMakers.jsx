import React, { useContext } from 'react';
import { Stack, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getCogMakeSpeedBonus } from '@parsers/world-3/construction';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import Timer from '@components/common/Timer';
import StatusText from '@components/common/StatusText';

const big = (value) => formatGame(value ?? 0, 'Big', { whole: true });

// The game's cog makers: each character in a maker adds its build speed, times the cog making speed, to that
// maker's progress every hour
const CogMakers = () => {
  const { state } = useContext(AppContext);
  const makers = state?.account?.construction?.cogMakers ?? [];
  const speed = getCogMakeSpeedBonus(state?.account);
  const speedText = formatNum(speed.value, 'mult');
  const characterOf = (name) => state?.characters?.find((character) => character?.name === name);
  const ready = makers.reduce((sum, maker) => sum + (maker?.ready ?? 0), 0);

  const makerCard = ({ maker, tier, icon, progress, ready: makerReady, previousReq, nextReq, characters }) => {
    const builders = characters.map((name) => ({ name, character: characterOf(name) }));
    const perHour = speed.value * builders.reduce((sum, { character }) => sum + (character?.constructionSpeed ?? 0), 0);
    const left = Math.max(0, nextReq - progress);
    const span = Math.max(nextReq - previousReq, 1);
    return <ItemCard key={maker} icon={`data/${icon}.png`} title={`${tier} cog maker`}
                     dimmed={!builders.length && !makerReady}
                     aside={makerReady > 0 ? <StatusText status={'ready'}>{`${formatNum(makerReady)} ready`}</StatusText> : null}>
      <ItemCard.Progress label={'Next cog'} value={big(progress)} max={big(nextReq)}
                         percent={Math.min(100, Math.max(0, ((progress - previousReq) / span) * 100))}/>
      <ItemCard.Facts rows={[
        ['Per hour', builders.length ? big(perHour) : 'No one building'],
        perHour > 0 ? ['Next cog in', <Timer key={'next'} type={'countdown'} component={'span'} sx={{ font: 'inherit' }}
                                             date={state?.lastUpdated + (left / perHour) * 3600 * 1000}
                                             placeholder={<StatusText status={'ready'}/>}/>] : null
      ]}/>
      {builders.length ? <ItemCard.Section label={'Building'}>
        {builders.map(({ name, character }) => <Stack key={name} direction={'row'} alignItems={'center'} gap={0.75}>
          <GameIcon src={`data/ClassIcons${character?.classIndex}.png`} size={24} alt={''}/>
          <Typography variant={'body2'} sx={{ flexGrow: 1 }}>{cleanUnderscore(name)}</Typography>
          <Typography variant={'body2'} color={'text.secondary'}>{`${big(character?.constructionSpeed)}/hr`}</Typography>
        </Stack>)}
      </ItemCard.Section> : null}
    </ItemCard>;
  };

  return <>
    <PageSummary>
      <StatTile label={'Cog making speed'} value={speedText} breakdownTitle={'Cog making speed'}
                breakdown={{ ...speed.breakdown, totalValue: speedText }}
                info={'Multiplies the build speed of every character in a cog maker.'}/>
      <StatTile label={'Cogs ready'} value={formatNum(ready)}
                info={'Each claim needs a free slot in your cog inventory.'}/>
    </PageSummary>
    <CardGrid size={'m'}>
      {makers.map(makerCard)}
    </CardGrid>
  </>;
};

export default CogMakers;
