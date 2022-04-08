import styled from 'styled-components'
import { cleanUnderscore, kFormatter, prefix } from "../../Utilities";
import { getStampBonus } from "../../parser/parserUtils";

const ArcadeShop = ({ labBonuses, stamps, arcade = {} }) => {
  const { shop, balls, goldBalls } = arcade;
  const getCost = (level) => {
    const multiplier = (labBonuses?.find((bonus) => bonus.name === 'Certified_Stamp_Book')?.active) ? 2 : 1;
    const arcadeStamp = getStampBonus(stamps, 'misc', 'StampC5', 0, multiplier);
    const arcadeStampMath = Math.max(0.6, 1 - arcadeStamp / 100);
    return Math.round(arcadeStampMath * (5 + (3 * level + Math.pow(level, 1.3))));
  }

  const getCostToMax = (level) => {
    let total = 0;
    for (let i = level; i < 100; i++) {
      total += getCost(i);
    }
    return total
  }

  return (
    <ArcadeShopStyle>
      <div className={'info'}>
        <div>
          <img src={`${prefix}data/PachiBall0.png`} alt=""/>
          Balls: {balls}
        </div>
        <div>
          <img className={'gold'} src={`${prefix}data/PachiBall1.png`} alt=""/>
          Gold Balls: {goldBalls}
        </div>
      </div>
      <div className="shop">
        {shop?.map((upgrade, index) => {
          const { level, effect, active, iconName, bonus } = upgrade;
          const eff = cleanUnderscore(effect.replace('{', bonus));
          const cost = getCost(level);
          const costToMax = getCostToMax(level);
          return <div className={'upgrade'} key={`${iconName}-${index}`}>
            <div>
              <img className={!active ? 'inactive' : ''} key={`${iconName}-${index}`}
                   src={`${prefix}data/${iconName}.png`}
                   alt=""/>
            </div>
            <div className={'desc'}>
              <div>Effect: {eff}</div>
              {level !== 100 ? <div>Lv: {level} / 100</div> :
                <div className={'done'}>MAXED</div>}
              <div>Cost: {kFormatter(cost, 2)}</div>
              <div>Cost to max: {kFormatter(costToMax, 2)}</div>
            </div>
          </div>
        })}
      </div>
    </ArcadeShopStyle>
  );
};

const ArcadeShopStyle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 50px;

  .info {
    > div {
      display: flex;
      align-items: center;
      gap: 10px;

      .gold {
        width: 22px;
        filter: hue-rotate(70deg) brightness(2);
      }
    }
  }

  .shop {
    display: flex;
    max-width: 1000px;
    flex-wrap: wrap;
    justify-content: center;
    margin: 0 auto;
    gap: 30px;

    .upgrade {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 25px;

      .desc {
        min-width: 350px;
      }
    }

    .done {
      color: #9de060;
    }
  }

  .inactive {
    filter: grayscale(1);
  }
`;

export default ArcadeShop;
