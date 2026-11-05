import { Stack, Typography } from '@mui/material';
import { isValid } from 'date-fns';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { getTaskQuantity } from '@parsers/world-2/weeklyBosses';
import useFormatDate from '@hooks/useFormatDate';
import { OPT } from '@parsers/accountOptions';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

export const TROPHY_ICON = 'data/Trophie.png';

// A UI skin is a 960 x 66 strip of the game's top bar: its left end, beside the skin's name
const skinIcon = (src) => <GameIcon src={src} fit={'strip'} side={'left'} size={32} alt={''}/>;

// One week: its shop priced in trophies, and the turn each character takes (only this week has a current turn)
const WeeklyBoss = ({ bossIndex, bossName, shopItems, triplets, date, account, characters, trophies }) => {
  const formatDate = useFormatDate();
  const currentTurn = bossIndex === 0 ? Number(account?.accountOptions?.[OPT.weeklyBossTurn]) : null;
  const turns = (triplets ?? []).slice(0, characters?.length ?? 0);

  const shopCard = ({ name, rawName, x1 }, index) => {
    const fixedRawName = rawName === 'FoodG' ? 'FoodG1' : rawName;
    return <ItemCard key={`shop-${index}`} title={cleanUnderscore(name)}
                     icon={name?.includes('_UI') ? skinIcon(`data/${fixedRawName}.png`) : `data/${fixedRawName}.png`}
                     footer={<ItemCard.Cost icon={TROPHY_ICON} iconAlt={'Trophies'} need={x1 ?? 0} have={trophies}
                                            format={(value) => formatNum(value, 'whole')}/>}/>;
  };

  const turnCard = ({ actions, task }, index) => {
    // The game fills the task's { with the rounded number as it is
    const quantity = Math.round(getTaskQuantity(index, task?.taskIndex, account, characters) ?? 0) || 0;
    return <ItemCard key={`turn-${index}`} icon={`etc/Req_Icon_${task?.rawName}.png`}
                     title={cleanUnderscore(task?.statText?.replace('{', quantity))}
                     meta={`Turn ${index + 1} · ${characters?.[index]?.name ?? ''}`}
                     status={currentTurn === index ? 'active' : undefined} statusLabel={'Your turn'}>
      {/* The { is the boss fight's number, which the toolbox does not compute */}
      <ItemCard.Desc text={(actions ?? []).map(({ description }) => cleanUnderscore(description?.replace('{', 'X')))}/>
    </ItemCard>;
  };

  return <Panel icon={`etc/${bossName}.png`} title={cleanUnderscore(bossName)}
                meta={isValid(date) ? formatDate(date) : undefined}>
    <Stack gap={3} sx={{ p: 2 }}>
      <Stack gap={1}>
        <Typography variant={'groupLabel'} color={'text.secondary'}>Shop items</Typography>
        <CardGrid size={'s'}>{(shopItems ?? []).map(shopCard)}</CardGrid>
      </Stack>
      {turns.length ? <Stack gap={1}>
        <Typography variant={'groupLabel'} color={'text.secondary'}>Turns</Typography>
        <CardGrid size={'m'}>{turns.map(turnCard)}</CardGrid>
      </Stack> : null}
    </Stack>
  </Panel>;
};

export default WeeklyBoss;
