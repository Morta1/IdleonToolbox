import styled from 'styled-components'
import { prefix } from "../../Utilities";

const Kitchens = ({ kitchens }) => {
  return (
    <KitchensStyle>
      {kitchens?.map((kitchen, index) => {
        if (!kitchen) return null;
        return <div className={'kitchen'} key={`kitchen-${index}`}>
          <div className={'kitchen-name'}>Table #{index + 1}</div>
          <div className={'box'}>
            {kitchen?.status >= 3 ?
              <div className={'cooking-with'}>
                <div>Cooking With Spices</div>
                <div>{kitchen?.spices?.map((spice, index) => {
                  if (spice === -1) return null;
                  return <img src={`${prefix}data/CookingSpice${spice}.png`} key={`${spice}-${index}`} alt={''}/>
                })}</div>
              </div> : <img className={'food'} src={`${prefix}data/${kitchen?.rawName}.png`} alt=""/>}
            <div className={'kitchen-stats-wrapper'}>
              <div>Kitchen Stats</div>
              <div className={'kitchen-stats'}>
                <span className={'green'}>Speed Lv.{kitchen?.speedLv}</span>
                <span className={'red'}>Fire Lv.{kitchen?.fireLv}</span>
                <span className={'blue'}>Luck Lv.{kitchen?.luckLv}</span>
              </div>
            </div>
          </div>
        </div>
      })}
    </KitchensStyle>
  );
};

const KitchensStyle = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 25px;

  .kitchen {
    min-width: 360px;

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
`;

export default Kitchens;
