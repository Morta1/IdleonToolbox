import styled from 'styled-components'
import { kFormatter, prefix } from "../../Utilities";
import { LinearProgressWithLabel } from "../Common/commonStyles";

const Kitchens = ({ meals, spices, kitchens }) => {

  const getRecipeTime = (possibleMeals) => {
    if (!possibleMeals) return 0;
    const lastMeal = possibleMeals[possibleMeals.length - 1];
    if (lastMeal?.index < meals.length) {
      return 2 * lastMeal?.cookReq
    }
    return 2 * 5000000000;
  }
  return (
    <KitchensStyle>
      {spices?.spicesAvailable ? <div className={'spices-wrapper'}>
        <div>Spices Available</div>
        <div className="spices">
          {spices?.spicesAvailable?.map((spice, index) => {
            return spice ? <div className={'spice'} key={`${spice?.spiceName}-${index}`}>
              <img src={`${prefix}data/${spice?.rawName}.png`} alt=""/>
              <span className={'amount'}>{kFormatter(parseInt(spice?.amount))}</span>
            </div> : null;
          })}
        </div>
      </div> : null}
      {spices?.spicesToClaim ? <div className={'spices-wrapper'}>
        <div>Spices to claim</div>
        <div className="spices">
          {spices?.spicesToClaim?.map((spice, index) => {
            return spice ? <div className={'spice'} key={`${spice?.spiceName}-${index}`}>
              <img src={`${prefix}data/${spice?.spiceName}.png`} alt=""/>
              <span className={'amount'}>{spice?.amount}</span>
            </div> : null;
          })}
        </div>
      </div> : null}
      <div className="kitchens">
        {kitchens?.map((kitchen, index) => {
          if (!kitchen) return null;
          const isRecipe = kitchen?.status >= 3;
          const recipeTime = getRecipeTime(kitchen?.possibleMeals);
          const percentOfCap = Math.round(kitchen?.currentProgress / recipeTime * 100);
          return <div className={'kitchen'} key={`kitchen-${index}`}>
            <div className={'kitchen-name'}>Table #{index + 1}</div>
            <div className={'box'}>
              {isRecipe ?
                <div className={'cooking-with'}>
                  <div>Cooking With Spices</div>
                  <div>{kitchen?.spices?.map((spice, index) => {
                    if (spice === -1) return null;
                    return <img src={`${prefix}data/CookingSpice${spice}.png`} key={`${spice}-${index}`} alt={''}/>
                  })}</div>
                </div> : <img className={'food'} src={`${prefix}data/${kitchen?.rawName}.png`} alt=""/>}
              {kitchen?.possibleMeals?.length > 0 ? <div>
                <div>Possible Meals</div>
                <div
                  className={'possible-meals'}>{kitchen?.possibleMeals?.map((food, index) =>
                  <img
                    key={`possible-${food?.rawName}-${index}`}
                    className={`possible-food${meals?.[food?.index]?.level === 0 ? ' hidden' : ''}`}
                    src={`${prefix}data/${food?.rawName}.png`}
                    alt=""/>)}
                </div>
              </div> : null}
              {isRecipe ? <div className={'progress'}>
                <div>Progress:</div>
                <LinearProgressWithLabel barcolor={'#3196e1'} barbgcolor={'#ffffff'} value={percentOfCap}/>
                {kFormatter(kitchen?.currentProgress)} / {kFormatter(recipeTime)}
              </div> : null}
              <div className={'kitchen-stats-wrapper'}>
                <div>Kitchen Stats</div>
                <div className={'kitchen-stats'}>
                  <div className={'green'}>
                    <span>Speed Lv.{kitchen?.speedLv}</span>
                    <div>{kFormatter(kitchen?.mealSpeed) ?? 0}/hr</div>
                  </div>
                  <span className={'red'}>Fire Lv.{kitchen?.fireLv}</span>
                  <span className={'blue'}>Luck Lv.{kitchen?.luckLv}</span>
                </div>
              </div>
            </div>
          </div>
        })}
      </div>
    </KitchensStyle>
  );
};

const KitchensStyle = styled.div`
  .spices-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .spices {
    margin-bottom: 25px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;

    .spice {
      position: relative;

      .amount {
        position: absolute;
        font-weight: bold;
        background: #000000eb;
        font-size: 13px;
        padding: 0 5px;
        text-align: center;
        left: 50%;
        transform: translateX(-50%);
        bottom: -10px;
      }
    }
  }

  .kitchens {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 25px;

    .kitchen {
      width: 360px;

      .kitchen-name {
        margin: 10px 0;
      }

      .box {
        position: relative;
        min-height: 135px;
        border: 1px solid white;
        padding: 15px;

        .kitchen-stats-wrapper {
          position: absolute;
          bottom: 15px;
        }
      }

      .cooking-with {
        > div {
          margin: 10px 0;
        }
      }

      .progress {
        margin-bottom: 80px;
      }

      .possible-meals {
        margin-bottom: 20px;
      }

      .kitchen-stats {
        display: flex;
        gap: 15px;

        .green {
          color: #6cdf6c;
        }

        .red {
          color: #f47a3c;
        }

        .blue {
          color: #0cb9ff;
        }
      }
    }


    .food {
      object-fit: cover;
      object-position: 0px -15px;
    }

    .possible-food {

      object-fit: cover;
      object-position: -15px -15px;
    }

    .hidden {
      filter: grayscale(1);
    }
  }
`;

export default Kitchens;
