import styled from 'styled-components'
import { cleanUnderscore, pascalCase } from "../../Utilities";

const ArenaBonuses = ({ maxArenaLevel, bonuses }) => {
  return (
    <ArenaBonusesStyle>
      <div className={'max-arena'}>Max Arena Wave: <span className={'bold'}>{maxArenaLevel}</span></div>
      <div className="bonuses">
        {bonuses?.map(({ bonus, wave }, index) => {
          return <div className={`bonus${maxArenaLevel < wave ? ' locked' : ''}`} key={`${wave}-${index}`}>
            <div>Wave {wave}</div>
            <div>{cleanUnderscore(pascalCase(bonus))}</div>
          </div>
        })}
      </div>
    </ArenaBonusesStyle>
  );
};

const ArenaBonusesStyle = styled.div`
  .max-arena {
    color: #47d947;
    text-align: center;
    margin-bottom: 50px;
  }

  .bonuses {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    max-width: 1000px;
  }

  .bonus {
    width: 300px;
  }

  .bold {
    font-weight: bold;
  }

  .locked {
    color: #989898;
  }
`;

export default ArenaBonuses;
