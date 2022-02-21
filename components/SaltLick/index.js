import styled from 'styled-components'
import { cleanUnderscore, kFormatter, prefix, round } from "../../Utilities";
import Unavailable from "../Common/Unavailable";

const SaltLick = ({ saltLick }) => {
  const calcBonusCost = (bonus) => {
    return Math.floor(bonus?.baseCost * Math.pow(bonus?.increment, bonus?.level ?? 0));
  }

  const calcCostToMax = (bonus) => {
    let costToMax = 0;
    for (let i = bonus?.level; i < bonus?.maxLevel; i++) {
      costToMax += calcBonusCost({ ...bonus, level: i });
    }
    return costToMax ?? 0;
  }

  const calcBonus = (bonus) => {
    return round(bonus.baseBonus * (bonus.level ?? 0));
  }

  return saltLick?.length ? (
    <SaltLickStyle>
      <div className={'wrapper'}>
        {saltLick?.map((bonus, index) => {
          const { desc, name, level, maxLevel, rawName, totalAmount } = bonus;
          const calculatedBonusCost = calcBonusCost(bonus);
          const costToMax = calcCostToMax(bonus);
          const calculatedBonus = calcBonus(bonus);
          return <div className={'bonus'} key={name + ' ' + index}>
            <div className={'text'}>
              <div>{cleanUnderscore(desc.replace('{', calculatedBonus))}</div>
              <div style={{ fontWeight: 'bold' }}
                   className={level === maxLevel ? 'ok' : ''}>Lv. {level}/{maxLevel}</div>
            </div>
            <div className={'cost'}>
              <img className={'resource'} src={`${prefix}data/${rawName}.png`} alt=""/>
              <span
                className={level >= maxLevel ? '' : totalAmount < calculatedBonusCost ? 'missing' : 'ok'}>{kFormatter(totalAmount, 2)}</span>&nbsp;/ {kFormatter(calculatedBonusCost, 2)}
            </div>
            <div className={'cost'}>
              <img className={'resource'} src={`${prefix}data/${rawName}.png`} alt=""/>
              <span
                className={level >= maxLevel ? '' : totalAmount < costToMax ? 'missing' : 'ok'}>{kFormatter(costToMax, 2)}</span>
            </div>
          </div>
        })}
      </div>
    </SaltLickStyle>
  ) : <Unavailable/>;
};

const SaltLickStyle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 25px;

  .wrapper {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .resource {
    width: 50px;
  }

  .missing {
    color: #f91d1d;
  }

  .ok {
    color: #6cdf6c;
  }

  .done {
    //color: #41d541;
  }

  .bonus {
    display: flex;
    gap: 40px;
  }

  .text {
    width: 450px;
    display: flex;
    align-self: center;
    flex-direction: column;
    gap: 10px;
  }

  .cost {
    display: flex;
    align-items: center;
    font-weight: bold;
    min-width: 220px;
  }
`;

export default SaltLick;
