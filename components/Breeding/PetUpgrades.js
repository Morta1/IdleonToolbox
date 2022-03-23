import styled from 'styled-components'
import { cleanUnderscore, kFormatter, prefix } from "../../Utilities";

const PetUpgrades = ({ petUpgrades }) => {
  const calcFoodCost = (upgrade) => {
    return upgrade?.baseCost * (1 + upgrade?.level) * Math.pow(upgrade?.costScale, upgrade?.level);
  }
  const calcCellCost = (upgrade) => {
    return upgrade?.baseMatCost * (1 + upgrade?.level) * Math.pow(upgrade?.costMatScale, upgrade?.level);
  }

  return (
    <PetUpgradesStyle>
      {petUpgrades?.map((upgrade, index) => {
        if (upgrade?.name === 'Filler') return null;
        return <div className={'upgrade'} key={upgrade?.name + '' + index}>
          <div className={'image'}>
            <img className={upgrade?.level === 0 ? 'offline' : ''} src={`${prefix}data/PetUpg${index}.png`} alt=""/>
            <div>Lv.{upgrade?.level} ({upgrade?.maxLevel})</div>
          </div>
          <div className={'info'}>
            <div className="header">
              <div className={'name'}>{cleanUnderscore(upgrade?.name)}</div>
              <div className={'desc'}>{cleanUnderscore(upgrade?.description)}</div>
            </div>
            <div className="cost">
              <div className={'cell-image'}>
                <img src={`${prefix}data/${upgrade?.material}.png`} alt=""/>
                {kFormatter(calcCellCost(upgrade))}
              </div>
              {index > 0 ? <div className={'food-image'}>
                <img src={`${prefix}data/CookingMB${upgrade?.foodIndex}.png`} alt=""/>
                <img src={`${prefix}data/CookingPlate0.png`} alt=""/>
                {kFormatter(calcFoodCost(upgrade))}
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

      .header {
        max-width: 650px;
      }
    }

    .cost {
      display: flex;
      align-items: center;

      //> img {
      //  object-fit: contain;
      //}

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
        width: 82px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    }

    .name {
      font-weight: bold;
    }
  }
`;

export default PetUpgrades;
