import React from 'react';
import { Divider, Stack, Typography } from '@mui/material';
import { commaNotation, getCoinsArray, notateNumber, prefix } from '@utility/helpers';
import UpgradeCard, { CardIcon, IconValueRow, LabelValue } from '@components/common/UpgradeCard';
import CoinDisplay from '@components/common/CoinDisplay';
import { formatLumi, StatusText } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import {
  PANEL_TEXT,
  pinkLumiLine,
  pinkShellLine,
  SILVER_LINES,
  YELLOW_BONUS_NAMES
} from '@utility/wiki/menagerie-jellies.mjs';

const Coins = ({ amount }) => <CoinDisplay title={''} variant={'horizontal'} centered={false}
                                           money={getCoinsArray(amount)}/>;

const FragmentCost = ({ amount }) => <IconValueRow src={'data/ObolFrag.png'} alt={'Obol Fragments'} iconSize={22}>
  {formatLumi(amount)}
</IconValueRow>;

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
    <LabelValue label={'LV'}>{commaNotation(silver?.levels?.[0] ?? 0)} / {silver?.maxLevels?.[0]}</LabelValue>
    {(silver?.levels?.[0] ?? 0) < (silver?.maxLevels?.[0] ?? 0) ? <FragmentCost amount={silver?.costs?.[0]}/> : null}
  </Upgrade>
  <Divider/>
  <Upgrade description={SILVER_LINES[1]}
           value={notateNumber(silver?.obolAutoTrashRate ?? 0, 'MultiplierInfo')}>
    <LabelValue label={'LV'}>{commaNotation(silver?.levels?.[1] ?? 0)} / {silver?.maxLevels?.[1]}</LabelValue>
    {(silver?.levels?.[1] ?? 0) < (silver?.maxLevels?.[1] ?? 0) ? <FragmentCost amount={silver?.costs?.[1]}/> : null}
  </Upgrade>
</>;

const YellowJelly = ({ yellow, buildSlotOpen }) => <>
  <LabelValue label={'8th Construction Slot'}>
    <Typography component={'span'} variant={'body2'} color={buildSlotOpen ? 'success.main' : 'error'}>
      {buildSlotOpen ? 'Open' : 'In use'}
    </Typography>
  </LabelValue>
  <LabelValue label={'Build progress'}>
    {formatLumi(yellow?.progress ?? 0)} / {formatLumi(yellow?.requirement ?? 0)}
  </LabelValue>
  {YELLOW_BONUS_NAMES.map((name, index) => {
    const bonus = yellow?.bonuses?.[index] ?? 0;
    const value = index < 3 ? `${notateNumber(1 + bonus / 100, 'MultiplierInfo')}x` : `+${commaNotation(bonus)}%`;
    return <LabelValue key={name} label={`LV ${commaNotation(yellow?.levels?.[index] ?? 0)}`}>
      {value} {name}
    </LabelValue>;
  })}
</>;

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
    return <>
      <LabelValue label={'Daily ladle usage'}>{commaNotation(jellies?.ladle ?? 0)}</LabelValue>
      <IconValueRow src={'data/Ladle.png'} alt={'Ladles'} iconSize={22}>
        {notateNumber(ladlesOwned ?? 0, 'Big')} Ladles owned
      </IconValueRow>
    </>;
  }
  if (index === 2) {
    return <>
      <LabelValue label={'Chapters tracked'}>
        {jellies?.red?.chaptersTracked ?? 0} / {jellies?.red?.chapterSlots ?? 14}
      </LabelValue>
      <ChapterPages pages={jellies?.red?.chapterPages}/>
      <LabelValue label={'Days rested'}>{commaNotation(jellies?.red?.level ?? 0)}</LabelValue>
      <LabelValue label={'Page reading multi'}>{commaNotation(jellies?.red?.readingMulti ?? 1)}x</LabelValue>
    </>;
  }
  if (index === 3) return <SilverJelly silver={jellies?.silver}/>;
  if (index === 4) return <YellowJelly yellow={jellies?.yellow} buildSlotOpen={buildSlotOpen}/>;
  return <LabelValue label={'Top 0.1% Nametags turned in'}>
    {commaNotation(jellies?.green?.nametagsDeposited ?? 0)} / {jellies?.green?.nametagsRequired ?? 12}
  </LabelValue>;
};

const Jellies = ({ jellies, ladlesOwned, buildSlotOpen }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {jellies?.sideUnlocked?.map(({ name, unlocked }, index) => {
      return <UpgradeCard key={name}
                          width={320}
                          dimmed={!unlocked}
                          icon={<CardIcon src={`data/MenaJelly${index + 1}.png`} width={56} height={72} alt={''}/>}
                          title={`${name} Jellyfish`}
                          badges={!unlocked ? <StatusText status={'locked'}/> : null}>
        <Stack gap={1}>
          {PANEL_TEXT[index] ? <Typography variant={'body2'} color={'text.secondary'}>{PANEL_TEXT[index]}</Typography> : null}
          <JellyContent index={index} jellies={jellies} ladlesOwned={ladlesOwned} buildSlotOpen={buildSlotOpen}/>
        </Stack>
      </UpgradeCard>;
    })}
  </Stack>;
};

export default Jellies;
