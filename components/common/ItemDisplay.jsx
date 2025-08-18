import styled from '@emotion/styled';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix } from 'utility/helpers';
import { Divider, Stack, Typography } from '@mui/material';
import { TitleAndValue } from './styles';
import { getGoldenFoodBonus } from '../../parsers/misc';
import React from 'react';
import { getPowerType } from '@parsers/obols';

const ItemDisplay = ({
                       character,
                       account,
                       Type,
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
                       showRawName
                     }) => {

  const allDesc = [desc_line1, desc_line2, desc_line3, desc_line4, desc_line5, desc_line6, desc_line7, desc_line8];
  let goldenFoodBonus = 0, isGoldenFood = displayName?.includes('Golden');
  if (isGoldenFood) {
    goldenFoodBonus = getGoldenFoodBonus(displayName, character, account)
  }
  const mergedDesc = allDesc.filter((desc) => desc !== 'Filler').join(' ').replace(/\[/, isGoldenFood
    ? notateNumber(goldenFoodBonus, 'Small')
    : Amount).replace(/]/, Cooldown);

  return displayName && displayName !== 'Empty' && displayName !== 'Locked' ? <>
    <Stack gap={1} direction={'row'} alignItems={'center'}>
      <ItemIcon src={`${prefix}data/${rawName}.png`} alt={displayName}/>
      <Typography fontWeight={'bold'}
                  variant={'subtitle1'}>{cleanUnderscore(displayName)}</Typography>
    </Stack>
    {showRawName ? <Typography fontWeight={'bold'}
                               variant={'subtitle2'}>{rawName}</Typography> : null}
    <Divider flexItem sx={{ my: 2 }}/>
    {Type?.includes('INVENTORY') || Type?.includes('CARRY') ? <Stack alignitems={'flex-start'}>
        {Type ? <TitleAndValue title={'Type'} value={cleanUnderscore(Type)}/> : null}
        {capacity ? <TitleAndValue title={Type?.includes('CARRY') ? 'Base capacity' : 'Description'}
                                   value={`${cleanUnderscore(capacity)}`}/> : null}
        {capacityPerSlot ? <TitleAndValue title={'Capacity per slot'}
                                          value={`${notateNumber(capacityPerSlot)}`}/> : null}
        {maxCapacity ? <TitleAndValue title={'Max capacity'}
                                      value={`${notateNumber(maxCapacity)}`}/> : null}
      </Stack> :
      <Stack alignitems={'flex-start'}>
        {Type ? <TitleAndValue title={'Type'} value={cleanUnderscore(Type)}/> : null}
        {capacity ? <TitleAndValue title={'Description'} value={`+${cleanUnderscore(capacity)} slots`}/> : null}
        {description ? <TitleAndValue value={cleanUnderscore(description)}/> : null}
        {mergedDesc.length > 0 ? <TitleAndValue value={cleanUnderscore(mergedDesc)}/> : null}
        {(allowNegativeValues || Speed >= 0) && Speed ? <TitleAndValue title={'Speed'} value={Speed}/> : null}
        {(allowNegativeValues || Weapon_Power >= 0) && Weapon_Power ? <TitleAndValue
          title={getPowerType(UQ1txt || rawName)} value={Weapon_Power}/> : null}
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
            <TitleAndValue title={'Amount'} value={numberWithCommas(amount)}/>
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
              ? notateNumber(value, 'Big')
              : value}/>)}
      </Stack>
    </> : null}
  </> : null;
};

const ItemIcon = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
`;

export default ItemDisplay;
