import styled from "@emotion/styled";
import { cleanUnderscore, prefix } from "utility/helpers";
import { Divider, Stack, Typography } from "@mui/material";
import { TitleAndValue } from "./styles";

const ItemDisplay = ({
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
                       desc_line1,
                       desc_line2,
                       desc_line3,
                       desc_line4,
                       desc_line5,
                       desc_line6,
                       desc_line7,
                       desc_line8,
                       Amount,
                       Cooldown,
                       capacity
                     }) => {
  const getPowerType = (type) => {
    let fixedType = type.toLowerCase();
    if (!fixedType) return "Weapon Power";
    if (fixedType.includes('mining')) {
      return 'Mining Power';
    } else if (fixedType.includes('fishin')) {
      return 'Fishing Power';
    } else if (fixedType.includes('choppin')) {
      return 'Choppin Power';
    } else if (fixedType.includes('catch')) {
      return 'Catching Power';
    }
    return "Weapon Power"
  }
  const allDesc = [desc_line1, desc_line2, desc_line3, desc_line4, desc_line5, desc_line6, desc_line7, desc_line8];
  const mergedDesc = allDesc.filter((desc) => desc !== 'Filler').join(' ').replace(/\[/, Amount).replace(/]/, Cooldown);

  return displayName && displayName !== 'Empty' && displayName !== 'Locked' && <>
    <Stack gap={1} direction={'row'} alignItems={'center'}>
      <ItemIcon src={`${prefix}data/${rawName}.png`} alt={displayName}/>
      <Typography fontWeight={'bold'}
                  variant={'subtitle1'}>{cleanUnderscore(displayName)}</Typography>
    </Stack>
    <Divider flexItem sx={{ my: 2 }} color={'black'}/>
    {Type?.includes('INVENTORY') || Type?.includes('CARRY') ? <Stack>
        {Type ? <TitleAndValue title={'Type'} value={cleanUnderscore(Type)}/> : null}
        {capacity ? <TitleAndValue title={Type?.includes('CARRY') ? 'Capacity' : 'Description'}
                                   value={`+${cleanUnderscore(capacity)} slots`}/> : null}
      </Stack> :
      <Stack>
        {Type ? <TitleAndValue title={'Type'} value={cleanUnderscore(Type)}/> : null}
        {capacity ? <TitleAndValue title={'Description'} value={`+${cleanUnderscore(capacity)} slots`}/> : null}

        {description ? <TitleAndValue value={cleanUnderscore(description)}/> : null}
        {mergedDesc.length > 0 ? <TitleAndValue value={cleanUnderscore(mergedDesc)}/> : null}
        {Speed ? <TitleAndValue title={'Speed'} value={Speed}/> : null}
        {Weapon_Power ? <TitleAndValue title={getPowerType(UQ1txt || rawName)} value={Weapon_Power}/> : null}
        {STR ? <TitleAndValue title={'STR'} value={STR}/> : null}
        {AGI ? <TitleAndValue title={'AGI'} value={AGI}/> : null}
        {WIS ? <TitleAndValue title={'WIS'} value={WIS}/> : null}
        {LUK ? <TitleAndValue title={'LUK'} value={LUK}/> : null}
        {Defence ? <TitleAndValue title={'Defence'} value={Defence}/> : null}
        {Reach ? <TitleAndValue title={'Reach'} value={Reach}/> : null}
        {UQ1txt && UQ1val ? <TitleAndValue title={'Misc'} value={cleanUnderscore(`+${UQ1val}${UQ1txt}`)}/> : null}
        {UQ2txt && UQ2val ? <TitleAndValue title={'Misc'} value={cleanUnderscore(`+${UQ2val}${UQ2txt}`)}/> : null}
        {Upgrade_Slots_Left > 0 ?
          <TitleAndValue title={'Upgrade Slots Left'} value={Upgrade_Slots_Left}/> : null}
      </Stack>}
  </>
};

const ItemIcon = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
`;

export default ItemDisplay;
