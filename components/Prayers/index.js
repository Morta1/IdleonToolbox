import styled from 'styled-components'
import { cleanUnderscore, kFormatter, prefix, round } from "../../Utilities";
import React from "react";

const Prayers = ({ prayers }) => {
  const calcCost = (prayer) => {
    const { level, costMulti, prayerIndex } = prayer
    if (level < 6) {
      return Math.round(costMulti * (1 + (4 + prayerIndex / 25) * level));
    }
    return Math.round(Math.min(2e9, costMulti * (1 + (1 + prayerIndex / 20) * level) * Math.pow(prayerIndex === 9 ? 1.3 : 1.12, level - 5)))
  }

  const calcCostToMax = (prayer) => {
    let costToMax = 0;
    for (let i = prayer?.level; i < prayer?.maxLevel; i++) {
      costToMax += calcCost({ ...prayer, level: i });
    }
    return costToMax ?? 0;
  }

  return (
    <PrayersStyle>
      {prayers?.map((prayer, index) => {
        const { name, x1, x2, level, prayerIndex, effect, curse, soul, maxLevel, totalAmount } = prayer
        const calculatedBonus = x1 + (x1 * (level - 1)) / 10;
        const calculatedCurse = x2 + (x2 * (level - 1)) / 10;
        const cost = calcCost(prayer);
        return <div className={'prayer'} key={name + index}>
          <div className={'image-wrapper'}>
            <img className={level === 0 ? 'not-acquired' : ''} src={`${prefix}data/Prayer${prayerIndex}.png`} alt=""/>
            <div>Lv.{level}</div>
          </div>
          <div className={'bonus-curse'}>
            <div className={'name'}>{cleanUnderscore(name)}</div>
            <div><span className={'bonus'}>Bonus:</span> {cleanUnderscore(effect).replace('{', calculatedBonus)}</div>
            <div><span className={'curse'}>Curse:</span> {cleanUnderscore(curse).replace('{', calculatedCurse)}</div>
          </div>
          <div className={'cost'}>
            <div>
              <img src={`${prefix}data/${soul}.png`} alt=""/>
            </div>
            {maxLevel === level ? <span className={'maxed'}>MAXED</span> : <div>
              <div>Cost: <span
                className={level === 0 ? '' : cost <= totalAmount ? 'ok' : 'missing'}>{kFormatter(round(cost), 2)}</span> ({kFormatter(totalAmount, 2)})
              </div>
              <div>Cost To Max: {kFormatter(round(calcCostToMax(prayer)))}</div>
            </div>}
          </div>
        </div>
      })}
    </PrayersStyle>
  );
};

const PrayersStyle = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;

  .prayer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 25px;

    & img {
      width: 36px;
      height: 36px;
    }

    .image-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }

    .bonus-curse {
      font-size: 16px;
      width: 300px;

      .name {
        font-weight: bold;
      }

      .bonus {
        color: #19b219;
        font-weight: bold;
      }

      .curse {
        color: #e82929;
        font-weight: bold;
      }
    }

    .cost {
      display: flex;
      gap: 5px;
      width: 300px;

      .maxed {
        color: #6cdf6c;
        display: flex;
        align-items: center;
      }
    }

    .ok {
      color: #6cdf6c;
    }

    .missing {
      color: #fa4e4e;
    }

    .not-acquired {
      filter: grayscale(1);
    }
  }
`;

export default Prayers;
