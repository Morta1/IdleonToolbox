import React, { useEffect, useState } from 'react';
import styled from 'styled-components'
import { cleanUnderscore, kFormatter, numberWithCommas, prefix } from "../../../Utilities";
import { TextField } from "@material-ui/core";
import EffectTooltip from "../../Common/Tooltips/EffectTooltip";
import { growth } from "../../General/calculationHelper";
import NumberTooltip from "../../Common/Tooltips/NumberTooltip";

const Bubbles = ({ bubbleCost, cauldron, cauldronName, goals, onGoalUpdate }) => {
  const [bubbleGoal, setBubbleGoal] = useState();

  useEffect(() => {
    if (goals) {
      setBubbleGoal(goals);
    } else {
      const levels = cauldron?.reduce((res, { level }, index) => ({ ...res, [index]: level }), {})
      setBubbleGoal(levels);
    }
  }, []);


  useEffect(() => {
    onGoalUpdate(cauldronName, bubbleGoal);
  }, [bubbleGoal]);

  const handleChange = (e, index) => {
    const { value } = e.target;
    setBubbleGoal({ ...bubbleGoal, [index]: !value ? 0 : parseInt(value) });
  }

  const accumulateBubbleCost = (index, level, baseCost, isLiquid, cauldronName) => {
    const levelDiff = bubbleGoal?.[index] - level;
    if (levelDiff <= 0) {
      return bubbleCost(level, baseCost, isLiquid, cauldronName);
    }
    const array = new Array(levelDiff || 0).fill(1);
    return array.reduce((res, _, levelInd) => {
        const cost = bubbleCost(level + (levelInd === 0 ? 1 : levelInd), baseCost, isLiquid, cauldronName);
        return res + cost;
      },
      bubbleCost(level, baseCost, isLiquid, cauldronName)
    );
  }

  const calculateEffect = (func, level, x1, x2) => {
    return growth(func, level, x1, x2);
  }

  return (
    <BubblesStyle>
      <div className="wrapper">
        {bubbleGoal ? cauldron?.map((bubble, index) => {
          const { level, itemReq, rawName, bubbleName, func, x1, x2 } = bubble;
          return <div className={'bubble-row'} key={`${bubbleName}${index}`}>
            <div className={'bubble-wrapper'}>
              <span className={'level'}>{level}</span>
              <EffectTooltip type={'bubble'} {...{ name: bubbleName, ...bubble }}
                             effect={calculateEffect(func, level, x1, x2)}>
                <img width={48} height={48} src={`${prefix}data/${rawName}.png`}
                     alt={''}/>
              </EffectTooltip>
            </div>
            <StyledTextField
              variant={'outlined'}
              defaultValue={bubbleGoal?.[index] ? bubbleGoal?.[index] < level ? level : bubbleGoal?.[index] : 0}
              inputProps={{ min: level || 0 }}
              type={'number'}
              onChange={(e) => handleChange(e, index)}
              label={'Goal'}/>
            <div className={'cost'}>
              {itemReq?.map(({ rawName, name, baseCost }, itemIndex) => {
                const cost = accumulateBubbleCost(index, level, baseCost, name?.includes('Liquid'), cauldronName);
                return name !== 'Blank' ? <div key={`${name}${itemIndex}`}>
                  <div><img className={'req-item'} src={`${prefix}data/${rawName}.png`} title={cleanUnderscore(name)}
                            alt=""/></div>
                  <NumberTooltip title={numberWithCommas(cost)}>
                    <span>{kFormatter(cost, 2)}</span>
                  </NumberTooltip>
                </div> : null
              })}
            </div>
          </div>
        }) : null}
      </div>
    </BubblesStyle>
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

const BubblesStyle = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 25px;

  .wrapper {
    text-align: center;
    font-size: 16px;
    display: grid;
    grid-template-columns: repeat(2, max-content);
    grid-template-rows: repeat(8, minmax(max-content, 1fr));
    grid-auto-flow: column;
    row-gap: 20px;
    column-gap: 100px;

    @media (max-width: 1300px){
      display: flex;
      flex-direction: column;
    }
  }

  .bubble-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;

    .bubble-wrapper {
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
      gap: 15px;

      > div {
        min-width: 70px;
      }

      .req-item {
        height: 32px;
        width: 32px;
      }
    }
  }
`;

export default Bubbles;
