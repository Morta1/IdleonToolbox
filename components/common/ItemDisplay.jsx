import { cleanUnderscore, formatNum, titleCaseName } from 'utility/helpers';
import { Divider, Stack, Typography } from '@mui/material';
import { TitleAndValue } from './styles';
import GameIcon from '@components/common/GameIcon';
import React from 'react';
import { getPowerType } from '@parsers/powerTypes';

// An ore's smelt time as the game's item box fills its ] (N.js): Cooldown / (4 x ForgeSpeeed(0)), rounded up in its
// unit. Forge slot 1's speed comes from the account when the caller passes it; without one it is the base 0.25.
const smeltTime = (cooldown, account) => {
  const seconds = (Number(cooldown) || 0) / (4 * (account?.forge?.list?.[0]?.speed || 0.25));
  return 60 > seconds ? `${Math.ceil(seconds)} Seconds` : 3600 > seconds ? `${Math.ceil(seconds / 60)} Minutes`
    : 86400 > seconds ? `${Math.ceil(seconds / 3600)} Hours` : `${Math.ceil(seconds / 86400)} Days`;
};

// The data's type is a raw key ("INVENTORY_G", "STORAGE_", "PREMIUM_HELMET"): a type as words
const typeName = (type) => (type?.startsWith('INVENTORY') ? 'Inventory Bag'
  : type?.startsWith('STORAGE') ? 'Storage Chest' : titleCaseName(cleanUnderscore(type)));
const slotsText = (slots) => `+${slots} slot${Number(slots) === 1 ? '' : 's'}`;
// An upgrade stone's lines as the game's item box fills them (N.js): * its chance, at most 100, # the slots it takes.
const stoneText = (text, chance, slots) => {
  const filled = text.replace('*', Math.min(Number(chance) || 0, 100)).replace('#', slots);
  return Number(slots) === 1 ? filled.replace('slots', 'slot') : filled;
};

const ItemDisplay = ({
                       character,
                       account,
                       Type,
                       typeGen,
                       description,
                       lvReqToEquip,
                       Class: className,
                       rawName,
                       displayName,
                       Defence,
                       Speed,
                       Weapon_Power,
                       Reach,
                       STR,
                       AGI,
                       WIS,
                       LUK,
                       UQ1txt,
                       UQ1val,
                       UQ2txt,
                       UQ2val,
                       Upgrade_Slots_Left,
                       maxUpgradeSlots,
                       desc_line1,
                       desc_line2,
                       desc_line3,
                       desc_line4,
                       desc_line5,
                       desc_line6,
                       desc_line7,
                       desc_line8,
                       Amount,
                       Trigger,
                       amount,
                       showAmount,
                       Cooldown,
                       capacity,
                       capacityPerSlot,
                       maxCapacity,
                       breakdown,
                       allowNegativeValues = true,
                       changes,
                       owners,
                       showRawName,
                       additionalInfo,
                       // Injected rather than imported. getGoldenFoodBonus lives in parsers/misc,
                       // which imports 32 other parser modules; importing it here put the whole
                       // parser graph on every page that renders an item tooltip - including the
                       // 148 public /tools/builds/* pages, where it returns 0 anyway because they
                       // have no character. Callers holding account context pass the real one.
                       getGoldenFoodBonus = () => 0,
                       characters
                     }) => {

  const allDesc = [desc_line1, desc_line2, desc_line3, desc_line4, desc_line5, desc_line6, desc_line7, desc_line8];
  let goldenFoodBonus = 0, isGoldenFood = displayName?.includes('Golden');
  if (isGoldenFood) {
    goldenFoodBonus = getGoldenFoodBonus(displayName, character, account, characters)
  }
  // The game's sentence carries its own %, so the bonus goes in bare.
  const filledDesc = allDesc.filter((desc) => desc && desc !== 'Filler').join(' ').replace(/\[/, isGoldenFood
    ? formatNum(goldenFoodBonus, 'pct', { bare: true })
    : Amount).replace(/]/, typeGen === 'bOre' ? smeltTime(Cooldown, account) : Cooldown);
  const mergedDesc = typeGen === 'dStone' ? stoneText(filledDesc, Amount, Trigger) : filledDesc;

  return displayName && displayName !== 'Empty' && displayName !== 'Locked' ? <>
    {/* An item card's header: the M card's 40 px icon, named by the title beside it */}
    <Stack gap={1} direction={'row'} alignItems={'center'}>
      <GameIcon src={`data/${rawName}.png`} fallback={`data/${rawName}_x1.png`} size={40} alt={''}/>
      <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(displayName)}</Typography>
    </Stack>
    {showRawName ? <Typography variant={'caption'} color={'text.secondary'}>{rawName}</Typography> : null}
    <Divider flexItem sx={{ my: 2 }}/>
    {Type?.includes('INVENTORY') || Type?.includes('CARRY') ? <Stack alignitems={'flex-start'}>
        {Type ? <TitleAndValue title={'Type'} value={typeName(Type)}/> : null}
        {capacity ? <TitleAndValue title={Type?.includes('CARRY') ? 'Base capacity' : 'Adds'}
                                   value={Type?.includes('CARRY') ? `${cleanUnderscore(capacity)}` : slotsText(capacity)}/> : null}
        {capacityPerSlot ? <TitleAndValue title={'Capacity per slot'}
                                          value={formatNum(capacityPerSlot, 'whole')}/> : null}
        {maxCapacity ? <TitleAndValue title={'Max capacity'}
                                      value={formatNum(maxCapacity, 'whole')}/> : null}
      </Stack> :
      <Stack alignitems={'flex-start'}>
        {Type ? <TitleAndValue title={'Type'} value={typeName(Type)}/> : null}
        {capacity ? <TitleAndValue title={'Adds'} value={slotsText(capacity)}/> : null}
        {/* One description: the filled-in lines when the item has them, else its own text, without the game's
            "Filler" padding (the raw text above the filled-in one read "Smelt down [ Ores ... Filler Filler") */}
        {mergedDesc ? <TitleAndValue value={cleanUnderscore(mergedDesc)}/>
          : description ? <TitleAndValue value={cleanUnderscore(description).replace(/\bFiller\b/g, '').replace(/\s+/g, ' ').trim()}/>
            : null}
        {(allowNegativeValues || Speed >= 0) && Speed ? <TitleAndValue title={'Speed'} value={Speed}/> : null}
        {(allowNegativeValues || Weapon_Power >= 0) && Weapon_Power ? <TitleAndValue
          title={getPowerType(UQ1txt || rawName, Type)} value={Weapon_Power}/> : null}
        {(allowNegativeValues || STR >= 0) && STR ? <TitleAndValue titleStyle={{ color: 'error.dark' }} title={'STR'}
                                                                   value={STR}/> : null}
        {(allowNegativeValues || AGI >= 0) && AGI ? <TitleAndValue titleStyle={{ color: 'success.dark' }} title={'AGI'}
                                                                   value={AGI}/> : null}
        {(allowNegativeValues || WIS >= 0) && WIS ? <TitleAndValue titleStyle={{ color: 'secondary.dark' }}
                                                                   title={'WIS'} value={WIS}/> : null}
        {(allowNegativeValues || LUK >= 0) && LUK ? <TitleAndValue titleStyle={{ color: 'warning.dark' }} title={'LUK'}
                                                                   value={LUK}/> : null}
        {(allowNegativeValues || Defence >= 0) && Defence ? <TitleAndValue title={'Defence'} value={Defence}/> : null}
        {(allowNegativeValues || Reach >= 0) && Reach ? <TitleAndValue title={'Reach'} value={Reach}/> : null}
        {UQ1txt && UQ1val ? <TitleAndValue title={'Misc'} value={cleanUnderscore(`+${UQ1val}${UQ1txt}`)}/> : null}
        {UQ2txt && UQ2val ? <TitleAndValue title={'Misc'} value={cleanUnderscore(`+${UQ2val}${UQ2txt}`)}/> : null}
        {Upgrade_Slots_Left > 0 ?
          <TitleAndValue title={'Upgrade Slots Left'} value={Upgrade_Slots_Left}/> : null}
        {amount > 0 && showAmount ?
          <>
            <Divider sx={{ my: 2 }}/>
            <TitleAndValue title={'Amount'} value={formatNum(amount, 'whole')}/>
          </> : null}
        {/*{maxUpgradeSlots > 0*/}
        {/*  ? <TitleAndValue title={'Upgrade Slots'}*/}
        {/*                   value={`${maxUpgradeSlots - Upgrade_Slots_Left} / ${maxUpgradeSlots}`}/>*/}
        {/*  : null}*/}

        {/*{changes ? <>*/}
        {/*  <Typography sx={{ mt: 2 }} variant={'body1'}>Changes</Typography>*/}
        {/*  <div style={{ whiteSpace: 'pre-line' }}>*/}
        {/*    {changes?.map((obj) => Object.entries(obj)).flat().join(' ').replace(/ /g, ' \n').replace(/,/g, ' ')}*/}
        {/*  </div>*/}
        {/*</> : null}*/}

        {owners?.length > 0 ? <>
          <Divider sx={{ my: 2 }}/>
          <TitleAndValue title={'Owners'} value={owners.join(', ')}/>
        </> : null}
      </Stack>}
    {breakdown ? <>
      <Divider sx={{ my: 1 }}/>
      <Stack>
        {breakdown?.map(({ name, value, title }, index) => title ? <Typography sx={{ fontWeight: 500 }}
                                                                               key={`${name}-${index}`}>{title}</Typography>
          : !name ? <Divider sx={{ my: 1 }} key={`${name}-${index}`}/> : <TitleAndValue
            key={`${name}-${index}`}
            titleStyle={{ width: 120 }}
            title={name}
            value={!isNaN(value)
              ? formatNum(value)
              : value}/>)}
      </Stack>
    </> : null}
    {additionalInfo ? additionalInfo : null}
  </> : null;
};

export default ItemDisplay;
