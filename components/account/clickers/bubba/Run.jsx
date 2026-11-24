import { Box, Stack, Typography } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import Num from '@components/common/Num';
import BonusStrip from '@components/common/cards/BonusStrip';
import ItemCard from '@components/common/cards/ItemCard';
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
const MultiTile = ({ label, icon, group, failed, info, children }) => {
  const locked = isLocked(group, failed);
  return <StatTile label={label} icon={icon} info={info} status={locked ? 'locked' : undefined}
                   value={failed ? '-' : locked ? `${group?.upgradeName} upgrade`
                     : <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} columnGap={1.5} rowGap={0.5}>
                       {/* The meat slice after each multi, as the game draws it: what it multiplies */}
                       <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                         <Num value={group?.multi ?? 1} kind={'mult'}/>
                         <GameIcon src={'etc/Bubba_0.png'} size={16} alt={'Meat slices'}/>
                       </Box>
                       {children}
                     </Stack>}/>;
};

// Each attribute's numeral on the game's chart, gold once emulsified
const Attribute = ({ attribute, index, maxLevel }) => {
  const { name, level, selected, emulsified } = attribute;
  const state = [emulsified && '(3x)', selected && level < maxLevel && 'Leveling'].filter(Boolean).join(' ');
  return <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
    <GameIcon src={`etc/Bubba_Charisma_${index}${emulsified ? '_Emulsified' : ''}.png`} size={24} alt={''}/>
    <Typography variant={'body2'} component={'span'} color={'text.secondary'}>
      {name} <Box component={'span'} sx={{ color: 'text.primary', fontWeight: 500 }}>{level}</Box>{state ? ` ${state}` : ''}
    </Typography>
  </Box>;
};

const CharismaTile = ({ charisma, failed }) => {
  const locked = isLocked(charisma, failed);
  const attributes = charisma?.attributes ?? [];
  return <StatTile label={'Charisma'} status={locked ? 'locked' : undefined}
                   value={failed ? '-' : locked ? `${charisma?.upgradeName} upgrade`
                     : <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} columnGap={1.5} rowGap={0.5}>
                       {attributes.map((attribute, index) => <Attribute key={attribute.name} attribute={attribute}
                                                                        index={index} maxLevel={charisma.maxLevel}/>)}
                     </Stack>}
                   info={failed ? undefined : <Box sx={{ minWidth: 220 }}>
                     <ItemCard.Facts rows={[
                       ...attributes.map(({ name, bonus }) => [name, bonus]),
                       ['Max level', charisma?.maxLevel]
                     ]}/>
                   </Box>}/>;
};

const giftInfo = ({ passive, trigger }) => <>
  <Typography variant={'body2'}>{passive}</Typography>
  <Typography variant={'body2'} color={'text.secondary'}>{trigger}</Typography>
</>;

const Run = ({ run, failed }) => {
  const { happiness, dice, smokedMeat, coins, charisma, gifts } = run ?? {};
  const giftsLocked = isLocked(gifts, failed);
  const chosen = failed ? [] : gifts?.selected ?? [];
  return <BonusStrip title={'This run'} meta={'Resets when you buy a Megaflesh'} sx={{ mb: 3 }}>
    <MultiTile label={'Happiness'} group={happiness} failed={failed} icon={`etc/Bubba_Happy_${happiness?.rank ?? 0}.png`}>
      <Typography variant={'body2'} component={'span'} color={'text.secondary'}>{happiness?.mood}</Typography>
    </MultiTile>
    <MultiTile label={'Frozen Dice'} group={dice} failed={failed} info={`Max roll: ${dice?.maxSides ?? '-'}`}>
      {(dice?.rolls ?? []).map((roll, index) => <Part key={index} icon={`data/BubbaDice${roll}.png`} value={roll}/>)}
    </MultiTile>
    <MultiTile label={'Smoked Meat'} group={smokedMeat} failed={failed}>
      {(smokedMeat?.meats ?? []).map((amount, index) => <Part key={index} icon={`data/BubbaSmokedmeat${index}.png`}
                                                             alt={`Smoked meat tier ${index + 1}`} value={amount}/>)}
    </MultiTile>
    <MultiTile label={'Spare Coins'} icon={'etc/Bubbo_Upgrade_21.png'} group={coins} failed={failed}>
      {(coins?.coins ?? []).map(({ name, amount }) => <Part key={name} label={name} value={amount}/>)}
    </MultiTile>
    <CharismaTile charisma={charisma} failed={failed}/>
    {/* One item of the row, so the gifts never part */}
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      {chosen.map((gift) => <StatTile key={gift.index} icon={`data/BubbaGift${gift.index}.png`} label={'Gift'}
                                      labelText={`Gift: ${gift.name}`} value={gift.name} info={giftInfo(gift)}/>)}
      {failed || chosen.length < (gifts?.slots ?? 1)
        ? <StatTile label={'Gift'} status={giftsLocked ? 'locked' : undefined}
                    value={failed ? '-' : giftsLocked ? `${gifts?.upgradeName} upgrade` : 'None selected'}/> : null}
    </Stack>
  </BonusStrip>;
};

export default Run;
