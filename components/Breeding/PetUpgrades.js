import styled from 'styled-components'
import { cleanUnderscore, kFormatter, prefix } from "../../Utilities";

const PetUpgrades = ({ meals, petUpgrades }) => {
  const calcFoodCost = (upgrade) => {
    return upgrade?.baseCost * (1 + upgrade?.level) * Math.pow(upgrade?.costScale, upgrade?.level);
  }
  const calcCellCost = (upgrade) => {
    return upgrade?.baseMatCost * (1 + upgrade?.level) * Math.pow(upgrade?.costMatScale, upgrade?.level);
  }
  const calcCostToMax = (upgrade, food) => {
    let costToMax = 0;
    for (let i = upgrade?.level; i < upgrade?.maxLevel; i++) {
      costToMax += food ? calcFoodCost({ ...upgrade, level: i }) : calcCellCost({ ...upgrade, level: i });
    }
    return costToMax ?? 0;
  }

  const calcBonus = (upgrade, upgradeIndex) => {
    if (0 === upgradeIndex || 2 === upgradeIndex || 4 === upgradeIndex) {
      return upgrade?.level;
    }
    if (1 === upgradeIndex) {
      return 4 * upgrade?.level;
    }
    if (3 === upgradeIndex) {
      return 25 * upgrade?.level;
    }
    if (5 === upgradeIndex) {
      return 1 + 0.25 * upgrade?.level;
    }
    if (6 === upgradeIndex) {
      return 6 * upgrade?.level;
    }
    if (7 === upgradeIndex) {
      return 1 + 0.3 * upgrade?.level;
    }
    if (8 === upgradeIndex) {
      return 1 + 2 * upgrade?.level;
    }
    if (9 === upgradeIndex) {
      return 1 + 0.05 * upgrade?.level;
    }
    if (10 === upgradeIndex) {
      return 10 * upgrade?.level;
    }
    if (11 === upgradeIndex) {
      return Math.ceil(12 * Math.pow(upgrade?.level, 0.698));
    }
    return 0;
  }

  return (
    <PetUpgradesStyle>
      {petUpgrades?.map((upgrade, index) => {
        if (upgrade?.name === 'Filler') return null;
        const foodAmount = meals?.[upgrade?.foodIndex]?.amount;
        const foodUpgradeCost = calcFoodCost(upgrade);
        const foodCostToMax = kFormatter(calcCostToMax(upgrade, true));
        const cellCostToMax = kFormatter(calcCostToMax(upgrade));
        console.log(`foodAmount >= foodUpgradeCost ${upgrade?.name}`, foodAmount)
        console.log(`foodAmount >= foodUpgradeCost ${upgrade?.name}`, foodUpgradeCost)
        return <div className={'upgrade'} key={upgrade?.name + '' + index}>
          <div className={'image'}>
            <img
              onError={(e) => {
                e.target.src = `${prefix}data/PetUpg0.png`;
                e.target.style = 'opacity: 0;'
              }}
              className={upgrade?.level === 0 ? 'offline' : ''} src={`${prefix}data/PetUpg${index - 1}.png`} alt=""/>
            <div>Lv.{upgrade?.level} ({upgrade?.maxLevel})</div>
          </div>
          <div className={'info'}>
            <div className="header">
              <div className={'name'}>{cleanUnderscore(upgrade?.name)}</div>
              <div className={'desc'}>{cleanUnderscore(upgrade?.description)}</div>
            </div>
            <div className={'bonus'}>
              <div className={'name'}>Effect</div>
              <div>{upgrade?.boostEffect === '_' ? 'NOTHING' : cleanUnderscore(upgrade?.boostEffect.replace('}', calcBonus(upgrade, index)))}</div>
            </div>
            <div className="cost">
              <div className={'cell-image'}>
                <img src={`${prefix}data/${upgrade?.material}.png`} alt=""/>
                {kFormatter(calcCellCost(upgrade))}
                <div>({cellCostToMax})</div>
              </div>
              {index > 0 ? <div className={'food-image'}>
                <img src={`${prefix}data/CookingMB${upgrade?.foodIndex}.png`} alt=""/>
                <img src={`${prefix}data/CookingPlate0.png`} alt=""/>
                <div style={{ textAlign: 'center' }}>
                  <span
                    className={upgrade?.level === 0 ? '' : foodAmount >= foodUpgradeCost ? 'ok' : 'missing'}>{kFormatter(foodAmount)}</span> /&nbsp;
                  <span>{kFormatter(foodUpgradeCost)}</span>
                  <div>({foodCostToMax})</div>
                </div>
              </div> : null}
            </div>
          </div>
        </div>
      })}
    </PetUpgradesStyle>
  );
};

const PetUpgradesStyle = styled.div`
  .offline {
    filter: grayscale(1);
  }

  .upgrade {
    display: flex;
    align-items: center;
    margin: 25px 0;
    gap: 10px;

    .image {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .info {
      display: flex;
      gap: 15px;

      .header {
        max-width: 450px;
      }

      .bonus {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100px;
        text-align: center;
        gap: 5px;
      }

      .cost {
        display: flex;
        align-items: center;

        .cell-image {
          display: flex;
          flex-direction: column;
          align-items: center;

          > img {
            height: 74px;
            object-fit: none;
          }
        }

        .food-image {
          width: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      }
    }

    .name {
      font-weight: bold;
    }


    .missing {
      color: #f91d1d;
    }

    .ok {
      color: #6cdf6c;
    }
  }
`;

export default PetUpgrades;
