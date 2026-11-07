import React from 'react';
import { Divider, Stack, Typography } from '@mui/material';
import { formatNum, getCoinsArray } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import CoinDisplay from '@components/common/CoinDisplay';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import Num from '@components/common/Num';
import {
  PANEL_TEXT,
  pinkLumiLine,
  pinkShellLine,
  SILVER_LINES,
  YELLOW_BONUS_NAMES
} from '@utility/wiki/menagerie-jellies.mjs';

const Coins = ({ amount }) => <CoinDisplay title={''} variant={'horizontal'} centered={false}
                                           money={getCoinsArray(amount)}/>;

const FragmentCost = ({ amount }) => <ItemCard.Cost icon={'data/ObolFrag.png'} iconAlt={'Obol Fragments'} need={amount}
                                                    game={'MenagerieStuff.SilverJellyCosts'}/>;

// One upgrade: its sentence, its value now as a Fact, then its cost (a render function, not a component)
const upgradeBlock = ({ description, value, children }) => <Stack gap={0.5}>
  <ItemCard.Desc>{description}</ItemCard.Desc>
  {value ? <ItemCard.Facts rows={[['Now', value]]}/> : null}
  {children}
</Stack>;

const PinkJelly = ({ pink }) => <>
  {upgradeBlock({
    description: pinkShellLine(formatNum(pink?.levels?.[0] ?? 0)),
    children: <Coins amount={pink?.costs?.[0]}/>
  })}
  <Divider/>
  {upgradeBlock({
    description: pinkLumiLine(formatGame(pink?.bonus ?? 0, 'MenagerieStuff.PinkJellyBonus')),
    children: <Coins amount={pink?.costs?.[1]}/>
  })}
</>;

const silverLevel = (silver, slot) => `${formatNum(silver?.levels?.[slot] ?? 0)} / ${formatNum(silver?.maxLevels?.[slot] ?? 0)}`;

const SilverJelly = ({ silver }) => <>
  {upgradeBlock({
    description: SILVER_LINES[0],
    value: <Num value={silver?.obolMulti ?? 1} game={'MenagerieStuff.ObolMISCmulti'} unit={'x'}/>,
    children: <>
      <ItemCard.Facts rows={[['LV', silverLevel(silver, 0)]]}/>
      {(silver?.levels?.[0] ?? 0) < (silver?.maxLevels?.[0] ?? 0) ? <FragmentCost amount={silver?.costs?.[0]}/> : null}
    </>
  })}
  <Divider/>
  {upgradeBlock({
    description: SILVER_LINES[1],
    value: formatGame(silver?.obolAutoTrashRate ?? 0, 'MenagerieStuff.ObolAutoTrashRate'),
    children: <>
      <ItemCard.Facts rows={[['LV', silverLevel(silver, 1)]]}/>
      {(silver?.levels?.[1] ?? 0) < (silver?.maxLevels?.[1] ?? 0) ? <FragmentCost amount={silver?.costs?.[1]}/> : null}
    </>
  })}
</>;

// Decision 1: the slot's state in words, "In use" in the neutral tone (busy, not an error)
const YellowJelly = ({ yellow, buildSlotOpen }) => <ItemCard.Facts rows={[
  ['8th construction slot', buildSlotOpen
    ? <StatusText key={'slot'} status={'ready'}>Open</StatusText>
    : <StatusText key={'slot'} status={'info'}>In use</StatusText>],
  // The game's build line, Big on both sides (MenagerieStuff.ConstBuildREQ)
  ['Build progress', `${formatGame(yellow?.progress ?? 0, 'MenagerieStuff.ConstBuildREQ', { whole: true })} / ${formatGame(yellow?.requirement ?? 0, 'MenagerieStuff.ConstBuildREQ', { whole: true })}`],
  ...YELLOW_BONUS_NAMES.map((name, index) => {
    const bonus = yellow?.bonuses?.[index] ?? 0;
    const perLevel = yellow?.perLevel?.[index] ?? 0;
    // The first three print MultiplierInfo of 1 + x / 100, the fourth the game's Round (ConstBuildBONUSES)
    const value = index < 3 ? formatNum(1 + bonus / 100, 'mult') : `+${formatGame(bonus, 'MenagerieStuff.ConstBuildBONUSES')}%`;
    const step = index < 3 ? formatNum(perLevel / 100, 'mult', { signed: true }) : formatNum(perLevel, 'pct', { signed: true });
    return [`LV\u00a0${formatNum(yellow?.levels?.[index] ?? 0)}`, <span key={name}>
      {value} {name}{' '}
      <Typography component={'span'} variant={'body2'} color={'text.secondary'}>({step}/lv)</Typography>
    </span>];
  })
]}/>;

// The Red Jellyfish's slots: the pages it has tracked per Spelunking chapter ("???" until it has some)
const ChapterPages = ({ pages }) => <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
  {pages?.map((amount, chapter) => <Stack key={chapter} alignItems={'center'} sx={{ width: 44 }}>
    <GameIcon src={`data/Spelunking${chapter}.png`} size={24} alt={`Chapter ${chapter + 1}`}
              status={amount > 0 ? undefined : 'missing'}/>
    <Typography variant={'caption'}>{amount > 0 ? formatNum(amount, 'whole') : '???'}</Typography>
  </Stack>)}
</Stack>;

const JellyContent = ({ index, jellies, ladlesOwned, buildSlotOpen }) => {
  if (index === 0) return <PinkJelly pink={jellies?.pink}/>;
  if (index === 1) {
    return <ItemCard.Facts rows={[
      ['Daily ladle usage', jellies?.ladle ?? 0, 'amount'],
      ['Ladles owned', ladlesOwned ?? 0, 'amount']
    ]}/>;
  }
  if (index === 2) {
    return <>
      <ItemCard.Facts rows={[['Chapters tracked', `${formatNum(jellies?.red?.chaptersTracked ?? 0)} / ${formatNum(jellies?.red?.chapterSlots ?? 14)}`]]}/>
      <ChapterPages pages={jellies?.red?.chapterPages}/>
      <ItemCard.Facts rows={[
        ['Days rested', jellies?.red?.level ?? 0, 'amount'],
        ['Page reading multi', `${formatGame(jellies?.red?.readingMulti ?? 1, 'MenagerieStuff.RedJellyReadingMulti')}x`]
      ]}/>
    </>;
  }
  if (index === 3) return <SilverJelly silver={jellies?.silver}/>;
  if (index === 4) return <YellowJelly yellow={jellies?.yellow} buildSlotOpen={buildSlotOpen}/>;
  return <ItemCard.Facts rows={[
    ['Top 0.1% Nametags turned in', `${formatNum(jellies?.green?.nametagsDeposited ?? 0)} / ${formatNum(jellies?.green?.nametagsRequired ?? 12)}`]
  ]}/>;
};

const Jellies = ({ jellies, ladlesOwned, buildSlotOpen }) => {
  return <CardGrid size={'m'}>
    {jellies?.sideUnlocked?.map(({ name, unlocked }, index) => {
      return <ItemCard key={name}
                       icon={`data/MenaJelly${index + 1}.png`}
                       iconSize={56}
                       title={`${name} Jellyfish`}
                       status={unlocked ? undefined : 'locked'}>
        {PANEL_TEXT[index] ? <ItemCard.Desc>{PANEL_TEXT[index]}</ItemCard.Desc> : null}
        <JellyContent index={index} jellies={jellies} ladlesOwned={ladlesOwned} buildSlotOpen={buildSlotOpen}/>
      </ItemCard>;
    })}
  </CardGrid>;
};

export default Jellies;
