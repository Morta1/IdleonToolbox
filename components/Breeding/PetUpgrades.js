import styled from 'styled-components'
import { cleanUnderscore, prefix } from "../../Utilities";

const PetUpgrades = ({ petUpgrades }) => {
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
              <img src={`${prefix}data/${upgrade?.material}.png`} alt=""/>
              {index > 0 ? <div className={'food-image'}>
                <img src={`${prefix}data/CookingMB${upgrade?.foodIndex}.png`} alt=""/>
                <img src={`${prefix}data/CookingPlate0.png`} alt=""/>
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

      > img {
        object-fit: contain;
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
