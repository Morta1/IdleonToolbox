import styled from 'styled-components'
import { cleanUnderscore, prefix } from "../../Utilities";

const Meals = ({ meals }) => {
  return (
    <MealsStyle>
      {meals?.map((meal, index) => {
        if (!meal) return null;
        const { name, rawName, effect, level, baseStat } = meal;
        return <div className={'meal'} key={`${name}-${index}`}>
          <div className={'images'}>
            <img className={`food${level <= 0 ? ' missing' : ''}`} src={`${prefix}data/${rawName}.png`} alt=""/>
            {level > 0 ? <img className='plate' src={`${prefix}data/CookingPlate${level - 1}.png`} alt=""/> : null}
          </div>
          <div className={'meal-desc'}>
            <div className={'name'}>{cleanUnderscore(name)}(Lv. {level})</div>
            <div className={level > 0 ? 'acquired' : ''}>{cleanUnderscore(effect?.replace('{', level * baseStat))}</div>
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
`;

export default Meals;
