import styled from 'styled-components'
import { kFormatter, prefix } from "../../Utilities";
import { LinearProgressWithLabel } from "../Common/commonStyles";
import { useMemo } from "react";

const Kitchens = ({ meals, spices, kitchens }) => {
  const calcTotals = (kitchens) => {
    return kitchens?.reduce((res, kitchen) => {
      const isCooking = kitchen?.status === 2;
      if (!isCooking) return res;
      const { rawName } = kitchen;
      return {
        ...res,
        [rawName]: (res[rawName] ?? 0) + Math.floor(kitchen?.mealSpeed / kitchen?.cookReq)

      }
    }, {})
  }
  const totals = useMemo(() => calcTotals(kitchens), [kitchens]);
  const getRecipeTime = (possibleMeals) => {
    if (!possibleMeals) return 0;
    const lastMeal = possibleMeals[possibleMeals.length - 1];
    if (lastMeal?.index < meals.length) {
      return 2 * lastMeal?.cookReq
    }
    return 2 * 5000000000;
  }

  const getSpiceForUpgrade = (kitchenIndex, upgradeType) => {
    return Math.floor(2 * kitchenIndex + upgradeType);
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
      <div className="totals">
        <div>Totals Cooking</div>
        {Object.entries(totals)?.map(([foodName, amount], index) => {
          return <div className={'total-food'} key={`${foodName}-${index}-${amount}`}>
            <img className={'food'} src={`${prefix}data/${foodName}.png`} alt=""/>
            <div>{amount}/hr</div>
          </div>
        })}
      </div>
      <div className="kitchens">
        {kitchens?.map((kitchen, kitchenIndex) => {
          if (!kitchen) return null;
          const isRecipe = kitchen?.status >= 3;
          const recipeTime = getRecipeTime(kitchen?.possibleMeals);
          const percentOfCap = Math.round(kitchen?.currentProgress / recipeTime * 100);
          return <div className={'kitchen'} key={`kitchen-${kitchenIndex}`}>
            <div className={'kitchen-name'}>Table #{kitchenIndex + 1}</div>
            <div className={'box'}>
              {isRecipe ?
                <div className={'cooking-with'}>
                  <div>Cooking With Spices</div>
                  <div>{kitchen?.spices?.map((spice, index) => {
                    if (spice === -1) return null;
                    return <img src={`${prefix}data/CookingSpice${spice}.png`} key={`${spice}-${index}`} alt={''}/>
                  })}</div>
                </div> : <div className={'food-per-hour'}>
                  <img className={'food'} src={`${prefix}data/${kitchen?.rawName}.png`} alt=""/>
                  <div>{kFormatter(Math.floor(kitchen?.mealSpeed / kitchen?.cookReq))}/hr</div>
                </div>}
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
                    <div className={'spice-upgrade-cost'}>
                      <span>{kFormatter(kitchen?.speedCost)}</span>
                      <img src={`${prefix}data/CookingSpice${getSpiceForUpgrade(kitchenIndex, 0)}.png`} alt={''}/>
                    </div>
                  </div>
                  <div className={'red'}>
                    <span className={'red'}>Fire Lv.{kitchen?.fireLv}</span>
                    <div>{kFormatter(kitchen?.fireSpeed) ?? 0}/hr</div>
                    <div className={'spice-upgrade-cost'}>
                      <span>{kFormatter(kitchen?.fireCost)}</span>
                      <img src={`${prefix}data/CookingSpice${getSpiceForUpgrade(kitchenIndex, 1)}.png`} alt={''}/>
                    </div>
                  </div>
                  <div className={'blue'}>
                    <span>Luck Lv.{kitchen?.luckLv}</span>
                    <div>{kFormatter(kitchen?.mealLuck, 1) ?? 0}x</div>
                    <div className={'spice-upgrade-cost'}>
                      <span>{kFormatter(kitchen?.luckCost)}</span>
                      <img src={`${prefix}data/CookingSpice${getSpiceForUpgrade(kitchenIndex, 2)}.png`} alt={''}/>
                    </div>
                  </div>
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

  .totals {
    margin: 20px 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .total-food {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
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

      .food-per-hour {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 120px;
      }

      .progress {
        margin-bottom: 120px;
      }

      .possible-meals {
        margin-bottom: 20px;
      }

      .kitchen-stats {
        display: flex;
        gap: 15px;

        .spice-upgrade-cost {
          display: flex;
          align-items: center;
          gap: 10px;
        }

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
