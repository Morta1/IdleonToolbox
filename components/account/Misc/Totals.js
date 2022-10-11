import { Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { kFormatter, numberWithCommas, prefix } from "utility/helpers";

const Totals = ({ account }) => {
  const calcBubbleLevels = (allBubbles) => {
    if (!allBubbles) return 0;
    return Object.values(allBubbles)?.reduce((res, bubbles) => res + bubbles?.reduce((bubbleLevels, { level }) => bubbleLevels + level, 0), 0);
  };

  const calcStampLevels = (allStamps) => {
    if (!allStamps) return 0;
    return Object.values(allStamps)?.reduce((res, stamps) => res + stamps?.reduce((stampsLevels, { level }) => stampsLevels + level, 0), 0);
  };

  const calcStatueLevels = (allStatues) => {
    if (!allStatues) return 0;
    return Object.values(allStatues)?.reduce((res, { level }) => res + level, 0);
  };

  const calcShrineLevels = (allShrines) => {
    if (!allShrines) return 0;
    return Object.values(allShrines)?.reduce((res, { shrineLevel }) => res + shrineLevel, 0);
  };

  const totalBubbleLevels = useMemo(() => calcBubbleLevels(account?.alchemy?.bubbles), [account]);
  const totalStampLevels = useMemo(() => calcStampLevels(account?.stamps), [account]);
  const totalStatueLevels = useMemo(() => calcStatueLevels(account?.statues), [account]);
  const totalShrineLevels = useMemo(() => calcShrineLevels(account?.shrines), [account]);

  return (
    <Stack>
      <Typography variant={'h5'}>Totals</Typography>
      <TotalStat text={'Total Bubbles'} icon={'aBrewOptionA0'} stat={totalBubbleLevels}/>
      <TotalStat text={'Total Stamps'} icon={'StampA34'} stat={totalStampLevels}/>
      <TotalStat text={'Total Statues'} icon={'EquipmentStatues1'} stat={totalStatueLevels}/>
      <TotalStat text={'Total Shrines'} icon={'UISkillIcon639'} stat={totalShrineLevels}/>
      <TotalStat text={'Highest Damage'} icon={'StampA8'} stat={account?.tasks?.[0]?.[1]?.[0]} formatting={'k'}/>
      <TotalStat text={'PO Orders'} icon={'DeliveryBox'} stat={account?.tasks?.[0]?.[1]?.[5]}/>
      <TotalStat text={'Monsters Killed'} icon={'UISkillIcon110'} stat={account?.tasks?.[0]?.[0]?.[0]}/>
      <TotalStat text={'Refined Salts'} icon={'TaskSc6'} stat={account?.tasks?.[0]?.[2]?.[0]}/>
      <TotalStat text={'Total Mats Printed'} icon={'PrintSlot'} stat={account?.tasks?.[0]?.[2]?.[3]} formatting={'k'}/>
    </Stack>
  );
};

const TotalStat = ({ text, icon, stat, formatting = 'commas' }) => {
  const finalStat = formatting === 'k' ? kFormatter(stat) : numberWithCommas(stat);
  return <Stack direction={'row'} alignItems={'center'} gap={1.5}>
    <img style={{ width: 40 }} src={`${prefix}data/${icon}.png`} alt=""/>
    <Typography variant={'body1'} component={'span'}>{text} :</Typography>
    <Typography variant={'body1'} component={'span'}>{finalStat}</Typography>
  </Stack>
}

export default Totals;
