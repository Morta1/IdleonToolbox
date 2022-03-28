import styled from 'styled-components'
import { cleanUnderscore, pascalCase } from "../../Utilities";

const ArenaBonuses = ({ maxArenaLevel, bonuses }) => {
  return (
    <ArenaBonusesStyle>
      <div>Max Arena Wave: <span className={'bold'}>{maxArenaLevel}</span></div>
      {bonuses?.map(({ bonus, wave }, index) => {
        return <div className={maxArenaLevel < wave ? 'locked' : ''} key={`${wave}-${index}`}>
          <div>Wave {wave}</div>
          <div>{cleanUnderscore(pascalCase(bonus))}</div>
        </div>
      })}
    </ArenaBonusesStyle>
  );
};

const ArenaBonusesStyle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;

  .bold {
    font-weight: bold;
  }

  .locked {
    color: #989898;
  }
`;

export default ArenaBonuses;
