import styled from 'styled-components'
import { kFormatter, prefix } from "../../Utilities";
import { useMemo } from "react";

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
    <TotalsStyle>
      <span className={'title'}>Totals</span>
      <div className={'total'}>
        <img src={`${prefix}data/aBrewOptionA0.png`} alt=""/>
        <div>Total Bubbles: {totalBubbleLevels}</div>
      </div>
      <div className={'total'}>
        <img src={`${prefix}data/StampA34.png`} alt=""/>
        <div>Total Stamps: {totalStampLevels}</div>
      </div>
      <div className={'total'}>
        <img src={`${prefix}data/EquipmentStatues1.png`} alt=""/>
        <div>Total Statues: {totalStatueLevels}</div>
      </div>
      <div className={'total'}>
        <img src={`${prefix}data/UISkillIcon639.png`} alt=""/>
        <div>Total Shrines: {totalShrineLevels}</div>
      </div>
      <div className={'total'}>
        <img src={`${prefix}data/StampA8.png`} alt=""/>
        <div>Highest Damage: {kFormatter(account?.highestDamage ?? 0)}</div>
      </div>
      <div className={'total'}>
        <img src={`${prefix}data/DeliveryBox.png`} alt=""/>
        <div>Post office orders: {kFormatter(account?.postOfficeOrders ?? 0)}</div>
      </div>
      <div className={'total'}>
        <img src={`${prefix}data/UISkillIcon110.png`} alt=""/>
        <div>Monsters Killed: {kFormatter(account?.monstersKilled ?? 0)}</div>
      </div>
      <div className={'total'}>
        <img src={`${prefix}data/TaskSc6.png`} alt=""/>
        <div>Refined Salts: {kFormatter(account?.refinedSalts ?? 0)}</div>
      </div>
    </TotalsStyle>
  );
};

const TotalsStyle = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  row-gap: 10px;

  & .title {
    display: inline-block;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .colo-container {
    width: 220px;
    display: flex;
    align-items: center;

    & img {
      height: 17px;
      width: 17px;
    }

    .colo-score {
      margin-left: 10px;
    }
  }
`;

export default Totals;
