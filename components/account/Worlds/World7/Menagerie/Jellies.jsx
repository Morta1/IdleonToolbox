import React from 'react';
import { Divider, Stack, Typography } from '@mui/material';
import { commaNotation, getCoinsArray, notateNumber, prefix } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import CoinDisplay from '@components/common/CoinDisplay';
import { formatLumi } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import {
  PANEL_TEXT,
  pinkLumiLine,
  pinkShellLine,
  SILVER_LINES,
  YELLOW_BONUS_NAMES
} from '@utility/wiki/menagerie-jellies.mjs';

const Coins = ({ amount }) => <CoinDisplay title={''} variant={'horizontal'} centered={false}
                                           money={getCoinsArray(amount)}/>;

const FragmentCost = ({ amount }) => <ItemCard.Cost icon={'data/ObolFrag.png'} iconAlt={'Obol Fragments'} need={amount}/>;

const Upgrade = ({ description, value, children }) => {
  return <Stack gap={.5}>
    <Typography variant={'body2'}>{description}</Typography>
    {value ? <Typography variant={'body1'} fontWeight={'bold'}>{value}</Typography> : null}
    {children}
  </Stack>;
};

const PinkJelly = ({ pink }) => <>
  <Upgrade description={pinkShellLine(commaNotation(pink?.levels?.[0] ?? 0))}>
    <Coins amount={pink?.costs?.[0]}/>
  </Upgrade>
  <Divider/>
  <Upgrade description={pinkLumiLine(commaNotation(pink?.bonus ?? 0))}>
    <Coins amount={pink?.costs?.[1]}/>
  </Upgrade>
</>;

const SilverJelly = ({ silver }) => <>
  <Upgrade description={SILVER_LINES[0]}
           value={`${notateNumber(silver?.obolMulti ?? 1, 'MultiplierInfo')}x`}>
    <ItemCard.Facts rows={[['LV', `${commaNotation(silver?.levels?.[0] ?? 0)} / ${silver?.maxLevels?.[0]}`]]}/>
    {(silver?.levels?.[0] ?? 0) < (silver?.maxLevels?.[0] ?? 0) ? <FragmentCost amount={silver?.costs?.[0]}/> : null}
  </Upgrade>
  <Divider/>
  <Upgrade description={SILVER_LINES[1]}
           value={notateNumber(silver?.obolAutoTrashRate ?? 0, 'MultiplierInfo')}>
    <ItemCard.Facts rows={[['LV', `${commaNotation(silver?.levels?.[1] ?? 0)} / ${silver?.maxLevels?.[1]}`]]}/>
    {(silver?.levels?.[1] ?? 0) < (silver?.maxLevels?.[1] ?? 0) ? <FragmentCost amount={silver?.costs?.[1]}/> : null}
  </Upgrade>
</>;

const YellowJelly = ({ yellow, buildSlotOpen }) => <ItemCard.Facts rows={[
  ['8th Construction Slot', <Typography key={'slot'} component={'span'} variant={'body2'}
                                        color={buildSlotOpen ? 'success.main' : 'error'}>
    {buildSlotOpen ? 'Open' : 'In use'}
  </Typography>],
  ['Build progress', `${formatLumi(yellow?.progress ?? 0)} / ${formatLumi(yellow?.requirement ?? 0)}`],
  ...YELLOW_BONUS_NAMES.map((name, index) => {
    const bonus = yellow?.bonuses?.[index] ?? 0;
    const perLevel = yellow?.perLevel?.[index] ?? 0;
    const value = index < 3 ? `${notateNumber(1 + bonus / 100, 'MultiplierInfo')}x` : `+${commaNotation(bonus)}%`;
    const step = index < 3 ? `+${notateNumber(perLevel / 100, 'MultiplierInfo')}x` : `+${commaNotation(perLevel)}%`;
    return [`LV\u00a0${commaNotation(yellow?.levels?.[index] ?? 0)}`, <span key={name}>
      {value} {name}{' '}
      <Typography component={'span'} variant={'body2'} color={'text.secondary'}>({step}/lv)</Typography>
    </span>];
  })
]}/>;

// The Red Jellyfish's slots: the pages it has tracked per Spelunking chapter ("???" until it has some)
const ChapterPages = ({ pages }) => <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
  {pages?.map((amount, chapter) => <Stack key={chapter} alignItems={'center'} sx={{ width: 44 }}>
    <img src={`${prefix}data/Spelunking${chapter}.png`} alt={`Chapter ${chapter + 1}`} width={28} height={28}
         style={{ objectFit: 'contain', opacity: amount > 0 ? 1 : .5 }}/>
    <Typography variant={'caption'}>{amount > 0 ? notateNumber(amount, 'Big') : '???'}</Typography>
  </Stack>)}
</Stack>;

const JellyContent = ({ index, jellies, ladlesOwned, buildSlotOpen }) => {
  if (index === 0) return <PinkJelly pink={jellies?.pink}/>;
  if (index === 1) {
    return <ItemCard.Facts rows={[
      ['Daily ladle usage', commaNotation(jellies?.ladle ?? 0)],
      ['Ladles owned', notateNumber(ladlesOwned ?? 0, 'Big')]
    ]}/>;
  }
  if (index === 2) {
    return <>
      <ItemCard.Facts rows={[['Chapters tracked', `${jellies?.red?.chaptersTracked ?? 0} / ${jellies?.red?.chapterSlots ?? 14}`]]}/>
      <ChapterPages pages={jellies?.red?.chapterPages}/>
      <ItemCard.Facts rows={[
        ['Days rested', commaNotation(jellies?.red?.level ?? 0)],
        ['Page reading multi', `${commaNotation(jellies?.red?.readingMulti ?? 1)}x`]
      ]}/>
    </>;
  }
  if (index === 3) return <SilverJelly silver={jellies?.silver}/>;
  if (index === 4) return <YellowJelly yellow={jellies?.yellow} buildSlotOpen={buildSlotOpen}/>;
  return <ItemCard.Facts rows={[
    ['Top 0.1% Nametags turned in', `${commaNotation(jellies?.green?.nametagsDeposited ?? 0)} / ${jellies?.green?.nametagsRequired ?? 12}`]
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
