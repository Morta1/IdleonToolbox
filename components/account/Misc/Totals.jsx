import { Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { notateNumber, prefix } from 'utility/helpers';
import { calcStampLevels } from '../../../parsers/stamps';
import Tooltip from '../../Tooltip';
import { calcStatueLevels } from '@parsers/statues';
import { calcShrineLevels } from '@parsers/shrines';
import { calcBubbleLevels } from '@parsers/alchemy';
import { getGiantMobChance } from '@parsers/misc';

const Totals = ({ account, characters }) => {

  const totalBubbleLevels = useMemo(() => calcBubbleLevels(account?.alchemy?.bubbles), [account]);
  const totalStampLevels = useMemo(() => calcStampLevels(account?.stamps), [account]);
  const totalStatueLevels = useMemo(() => calcStatueLevels(account?.statues), [account]);
  const totalShrineLevels = useMemo(() => calcShrineLevels(account?.shrines), [account]);
  const giantMob = getGiantMobChance(characters?.[0], account);

  return (
    <Stack gap={1}>
      <Typography variant={'h5'}>Totals</Typography>
      <TotalStat text={'Bubbles'} icon={'aBrewOptionA0'} stat={totalBubbleLevels}/>
      <TotalStat text={'Stamps'} icon={'StampA34'} stat={totalStampLevels}/>
      <TotalStat text={'Statues'} icon={'EquipmentStatues1'} stat={totalStatueLevels}/>
      <TotalStat text={'Shrines'} icon={'UISkillIcon639'} stat={totalShrineLevels}/>
      <TotalStat text={'Highest Damage'} icon={'StampA8'} stat={account?.tasks?.[0]?.[1]?.[0]}/>
      <TotalStat text={'PO Orders'} icon={'DeliveryBox'} stat={account?.tasks?.[0]?.[1]?.[5]}/>
      <TotalStat text={'Monsters Killed'} icon={'UISkillIcon110'} stat={account?.tasks?.[0]?.[0]?.[0]}/>
      <TotalStat text={'Refined Salts'} icon={'TaskSc6'} stat={account?.tasks?.[0]?.[2]?.[0]}/>
      <TotalStat text={'Mats Printed'} icon={'PrintSlot'} stat={account?.tasks?.[0]?.[2]?.[3]}/>
      <TotalStat text={'Trashed Cogs'} icon={'Cog3B4'} stat={account?.tasks?.[0]?.[2]?.[1]}/>
      <TotalStat text={'Plants Picked'} icon={'GamingPlant1'} stat={account?.tasks?.[0]?.[4]?.[3]}/>
      {account?.finishedWorlds?.World2 ? <>
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <Tooltip title={<Stack>
            <Typography sx={{ fontWeight: 'bold' }}>Giant Mob Chance</Typography>
            <Typography>+{giantMob?.crescentShrineBonus}% from Crescent shrine</Typography>
            <Typography>+{giantMob?.giantMobVial}% from Shaved Ice vial</Typography>
            {giantMob?.glitterbugPrayer > 0 ?
              <Typography>-{giantMob?.glitterbugPrayer}% from Glitterbug prayer</Typography> : null}
          </Stack>}>
            <Stack gap={1} direction={'row'} alignItems={'center'}>
              <img style={{ width: 35, height: 35 }} alt={'giant'} src={`${prefix}data/Prayer5.png`}/>
              <Typography>1
                in {notateNumber(Math.floor(1 / giantMob?.chance))}</Typography>
            </Stack>
          </Tooltip>
        </Stack>
      </> : null}
    </Stack>
  );
};

const TotalStat = ({ text, icon, stat }) => {
  return <Stack direction={'row'} alignItems={'center'} gap={1.5}>
    <img style={{ width: 35, height: 35 }} src={`${prefix}data/${icon}.png`} alt={`${text}-total-icon`}/>
    <Typography variant={'body1'} component={'span'}>{text} :</Typography>
    <Tooltip title={stat}>
      <Typography variant={'body1'} component={'span'}>{notateNumber(stat)}</Typography>
    </Tooltip>
  </Stack>
}

export default Totals;
