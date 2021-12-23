import { cleanUnderscore, kFormatter, numberWithCommas, prefix } from "../../Utilities";
import styled from 'styled-components';
import React, { useEffect, useState } from "react";
import { TextField } from "@material-ui/core";
import EffectTooltip from "../Common/Tooltips/EffectTooltip";
import { growth } from "../General/calculationHelper";
import NumberTooltip from "../Common/Tooltips/NumberTooltip";
import CoinDisplay from "../General/CoinDisplay";

const Stamps = ({ stamps, onGoalUpdate, categoryName, goals, reductionVial, reductionBribe }) => {
  // BLUE_FLAV - growth(name, func, level, x1, x2)
  const [stampGoal, setStampGoal] = useState();

  useEffect(() => {
    if (goals) {
      setStampGoal(goals);
    } else {
      const levels = stamps?.reduce((res, { level }, index) => ({ ...res, [index]: level }), {})
      setStampGoal(levels);
    }
  }, []);

  useEffect(() => {
    onGoalUpdate(categoryName, stampGoal);
  }, [stampGoal]);

  const handleChange = (e, index) => {
    const { value } = e.target;
    setStampGoal({ ...stampGoal, [index]: !value ? 0 : parseInt(value) });
  }

  const accumulateCost = (index, level, type, stamp) => {
    const levelDiff = stampGoal?.[index] - level;
    const costFunc = type === 'gold' ? calculateGoldCost : calculateMaterialCost;
    if (levelDiff <= 0) {
      const cost = costFunc(level, stamp);
      return type === 'material' ? Math.floor(cost) : cost;
    }
    const array = Array(levelDiff || 0).fill(1).map((_, ind) => ind + 1);
    const totalCost = array.reduce((res, levelInd) => {
        if ((type === 'material' && (level + (levelInd)) % stamp?.reqItemMultiplicationLevel === 0) || type === 'gold') {
          const cost = costFunc(level + (levelInd), stamp);
          return res + cost;
        }
        return res;
      },
      costFunc(level, stamp)
    );
    return type === 'material' ? Math.floor(totalCost) : totalCost;
  }

  const calculateGoldCost = (level, { reqItemMultiplicationLevel, baseCoinCost, powCoinBase }) => {
    const reductionVal = getMaterialReductionValue();
    const realBaseCost = reductionBribe?.done ? baseCoinCost * (1 - (reductionBribe?.value / 100)) : baseCoinCost;
    const cost = (realBaseCost * Math.pow(powCoinBase - (level / (level + 5 * reqItemMultiplicationLevel)) * 0.25, level * (10 / reqItemMultiplicationLevel))) * Math.max(0.1, 1 - (reductionVal / 100));
    return Math.floor(cost);
  }

  const getMaterialReductionValue = () => {
    const { func, level, x1, x2 } = reductionVial || {}
    return growth(func, level, x1, x2);
  }

  const calculateMaterialCost = (level, { reqItemMultiplicationLevel, baseMatCost, powMatBase }) => {
    const reductionVal = getMaterialReductionValue();
    return (baseMatCost * Math.pow(powMatBase, Math.pow(Math.round(level / reqItemMultiplicationLevel) - 1, 0.8))) * Math.max(0.1, 1 - (reductionVal / 100)) || 0;
  }
  return (
    <StampsWrapper>
      <div className={'stamp-wrapper'}>
        {stampGoal && stamps?.map((stamp, index) => {
          const {
            displayName, rawName, func, level, x1, x2, itemReq, effect, reqItemMultiplicationLevel
          } = stamp;
          return displayName !== 'FILLER' && displayName !== 'Blank' ?
            <div className={'stamp-row'} key={rawName + '' + displayName + '' + index}>
              <div className={'stamp-icon-wrapper'}>
                {level !== 0 ? <span className={'level'}>{level}</span> : null}
                <EffectTooltip {...{ name: displayName, desc: effect, ...stamp }}
                               type={'stamp'}
                               effect={growth(func, level, x1, x2)}>
                  <img width={48} height={48} className={`${level === 0 && 'missing'}`}
                       src={`${prefix}data/${rawName}.png`}
                       alt=""/>
                </EffectTooltip>
              </div>
              <StyledTextField
                disabled={level === 0}
                variant={'outlined'}
                defaultValue={stampGoal?.[index] ? stampGoal?.[index] < level ? level : stampGoal?.[index] : 0}
                inputProps={{ min: level || 0 }}
                type={'number'}
                onChange={(e) => handleChange(e, index)}
                label={'Goal'}/>
              <div className={'cost'}>
                {itemReq?.map(({ rawName, name }, itemIndex) => {
                  const goldCost = accumulateCost(index, level, 'gold', stamp);
                  const isMaterialCost = stampGoal?.[index] % reqItemMultiplicationLevel === 0;
                  const materialCost = accumulateCost(index, level, 'material', stamp);
                  return name !== 'Blank' ? <React.Fragment key={`${rawName}-${name}-${itemIndex}`}>
                    <div className={`materials${!isMaterialCost ? ' semi-hide' : ''}`}>
                      <img className={'req-item'} src={`${prefix}data/${rawName}.png`}
                           title={cleanUnderscore(name)}
                           alt=""/>
                      <NumberTooltip title={numberWithCommas(parseInt(isMaterialCost ? materialCost : goldCost))}>
                        <span>{kFormatter(materialCost, 2)}</span>
                      </NumberTooltip>
                    </div>
                    <CoinDisplay money={String(parseInt(goldCost)).split(/(?=(?:..)*$)/)}/>
                  </React.Fragment> : null
                })}
              </div>
            </div> : null
        })}
      </div>
    </StampsWrapper>
  );
};


const StyledTextField = styled(TextField)`
  && {
    width: 90px;
  }

  && label.Mui-focused {
    color: white;
  }
`;

const StampsWrapper = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 25px;

  .stamp-wrapper {
    text-align: center;
    font-size: 16px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    row-gap: 40px;
    column-gap: 100px;
  }

  .stamp-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
  }

  .stamp-icon-wrapper {
    display: inline-block;
    position: relative;

    > img {
      width: 48px;
      height: 48px;
    }

    .level {
      position: absolute;
      top: -10px;
      right: 0;
      font-weight: bold;
      background: #000000eb;
      font-size: 13px;
      padding: 0 5px;
    }
  }

  .cost {
    display: flex;
    flex-direction: column;
    margin-left: 15px;

    > div {
      min-width: 120px;
    }

    .materials {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .semi-hide {
      filter: grayscale(1);
    }

    .req-item {
      height: 32px;
      width: 32px;
    }
  }


  .missing {
    filter: grayscale(1);
    opacity: 0.3;
  }
`;

export default Stamps;
