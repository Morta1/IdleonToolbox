import styled from 'styled-components'
import { cleanUnderscore, numberWithCommas, kFormatter, prefix } from "../../Utilities";
import { useMemo } from "react";

const Meals = ({ meals, kitchens }) => {
  const totalMealSpeed = useMemo(() => kitchens?.reduce((sum, kitchen) => sum + kitchen.mealSpeed, 0))

  const getMealLevelCost = (level) => {
    const baseMath = 10 + (level + Math.pow(level, 2));
    return baseMath * Math.pow(1.2 + 0.05 * level, level);
  }

  return (
    <MealsStyle>
      {meals?.map((meal, index) => {
        if (!meal) return null;
        const { name, amount, rawName, effect, level, baseStat, cookReq} = meal;
        const levelCost = getMealLevelCost(level);
        const timeTillNextLevel = amount >= levelCost ? '0' : ((levelCost - amount) * cookReq / totalMealSpeed);

        const divStyle = {
          height: '100%',
        };
        return <div className={'meal'} key={`${name}-${index}`}>
          <div className={'images'} style={divStyle}>
            <img className={`food${level <= 0 ? ' missing' : ''}`} src={`${prefix}data/${rawName}.png`} alt=""/>
            {level > 0 ? <img className='plate' src={`${prefix}data/CookingPlate${level - 1}.png`} alt=""/> : null}
          </div>
          <div className={'meal-desc'}>
            <div className={'name'}>{cleanUnderscore(name)}(Lv. {level})</div>
            <div className={level > 0 ? 'acquired' : ''}>{cleanUnderscore(effect?.replace('{', level * baseStat))}</div>
            <div>
              <span
                className={level === 0 ? '' : amount >= levelCost ? 'ok' : 'missing-mat'}>{numberWithCommas(parseInt(amount))}</span> / {numberWithCommas(parseInt(levelCost))}
            </div>
            <div>
              Time till next level {kFormatter(timeTillNextLevel, 2)}hr
            </div>
          </div>

        </div>
      })}
    </MealsStyle>
  );
};

const MealsStyle = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(150px, 1fr));
  grid-gap: 10px;

  .meal {
    display: flex;
    align-items: center;

    .images {
      width: 82px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .meal-desc {
      display: flex;
      flex-direction: column;

      .name {
        font-weight: bold;
      }

      & > div {
        margin: 10px 0;
      }
    }
  }

  .acquired {
    color: #6cdf6c;
  }

  .missing {
    filter: grayscale(1);
  }

  .missing-mat {
    color: #f91d1d;
  }

  .ok {
    color: #6cdf6c;
  }
`;

export default Meals;
