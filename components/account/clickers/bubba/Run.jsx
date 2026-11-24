import { Box, Stack, Typography } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import Num from '@components/common/Num';
import BonusStrip from '@components/common/cards/BonusStrip';
import StatTile from '@components/common/cards/StatTile';

const isLocked = (group, failed) => !failed && !group?.unlocked;

// What made the multiplier, beside it in the tile: a sprite (or a word) and its number each
const Part = ({ icon, label, alt, value }) => <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
  {icon ? <GameIcon src={icon} size={24} alt={alt ?? ''}/> : null}
  <Typography variant={'body2'} component={'span'} color={'text.secondary'}>
    {label ? `${label} ` : null}<Num value={value} kind={'whole'}/>
  </Typography>
</Box>;

// A locked feature names the upgrade it waits on, as the bonuses above do
const MultiTile = ({ label, group, failed, info, children }) => {
  const locked = isLocked(group, failed);
  return <StatTile label={label} info={info} status={locked ? 'locked' : undefined}
                   value={failed ? '-' : locked ? `${group?.upgradeName} upgrade`
                     : <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} columnGap={1.5} rowGap={0.5}>
                       <span><Num value={group?.multi ?? 1} kind={'mult'}/></span>
                       {children}
                     </Stack>}/>;
};

const attributeState = ({ selected, emulsified, level }, maxLevel) => [
  emulsified && 'Emulsified (3x)',
  selected && (level < maxLevel ? 'Leveling' : 'Selected')
].filter(Boolean).join(', ');

const AttributeTile = ({ attribute, charisma, failed }) => {
  const { name, level, bonus } = attribute;
  const state = failed ? '' : attributeState(attribute, charisma.maxLevel);
  const locked = isLocked(charisma, failed);
  return <StatTile label={name} status={locked ? 'locked' : undefined}
                   value={failed ? '-' : state ? <Stack direction={'row'} alignItems={'baseline'} flexWrap={'wrap'} columnGap={1}>
                     <span>Lv {level}</span>
                     <Typography variant={'body2'} component={'span'} color={'text.secondary'}>{state}</Typography>
                   </Stack> : `Lv ${level}`}
                   info={<>
                     <Typography variant={'body2'}>{failed ? '-' : bonus}</Typography>
                     <Typography variant={'body2'} color={'text.secondary'}>Max Lv {charisma.maxLevel}</Typography>
                   </>}/>;
};

const giftInfo = ({ passive, trigger }) => <>
  <Typography variant={'body2'}>{passive}</Typography>
  <Typography variant={'body2'} color={'text.secondary'}>{trigger}</Typography>
</>;

const Run = ({ run, failed }) => {
  const { dice, smokedMeat, coins, charisma, gifts } = run ?? {};
  const giftsLocked = isLocked(gifts, failed);
  const chosen = failed ? [] : gifts?.selected ?? [];
  return <BonusStrip title={'This run'} bare sx={{ mb: 3 }}>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      <MultiTile label={'Frozen Dice'} group={dice} failed={failed} info={`Max roll: ${dice?.maxSides ?? '-'}`}>
        {(dice?.rolls ?? []).map((roll, index) => <Part key={index} icon={`data/BubbaDice${roll}.png`} value={roll}/>)}
      </MultiTile>
      <MultiTile label={'Smoked Meat'} group={smokedMeat} failed={failed}>
        {(smokedMeat?.meats ?? []).map((amount, index) => <Part key={index} icon={`data/BubbaSmokedmeat${index}.png`}
                                                               alt={`Smoked meat tier ${index + 1}`} value={amount}/>)}
      </MultiTile>
      <MultiTile label={'Spare Coins'} group={coins} failed={failed}>
        {(coins?.coins ?? []).map(({ name, amount }) => <Part key={name} label={name} value={amount}/>)}
      </MultiTile>
    </Stack>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      {(charisma?.attributes ?? []).map((attribute) => <AttributeTile key={attribute.name} attribute={attribute}
                                                                     charisma={charisma} failed={failed}/>)}
      {chosen.map((gift) => <StatTile key={gift.index} icon={`data/BubbaGift${gift.index}.png`} label={'Gift'}
                                      labelText={`Gift: ${gift.name}`} value={gift.name} info={giftInfo(gift)}/>)}
      {failed || chosen.length < (gifts?.slots ?? 1)
        ? <StatTile label={'Gift'} status={giftsLocked ? 'locked' : undefined}
                    value={failed ? '-' : giftsLocked ? `${gifts?.upgradeName} upgrade` : 'None selected'}/> : null}
    </Stack>
  </BonusStrip>;
};

export default Run;
