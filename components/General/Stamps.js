import { cleanUnderscore, prefix } from "../../Utilities";
import styled from 'styled-components';

const Stamps = ({ stamps }) => {
  return (
    <StampsWrapper>
      <div className={'stamp-group'}>
        {stamps?.map(({ name, rawName, level }, index) => {
          return name !== 'FILLER' && name !== 'Blank' ? <div key={name + index} className={'stamp-wrapper'}>
            <span className={'level'}>{level}</span>
            <img title={cleanUnderscore(name)} src={`${prefix}data/${rawName}.png`} alt=""/>
          </div> : null;
        })}
      </div>
    </StampsWrapper>
  );
};

const StampsWrapper = styled.div`
  .stamp-group {
    justify-content: center;
    display: grid;
    grid-template-columns: repeat(4, 72px);
    grid-template-rows: repeat(auto-fit, 72px);
  }

  .stamp-wrapper {
    display: inline-block;
    position: relative;

    .level {
      position: absolute;
      top: -10px;
      right: 0;
      font-weight: bold;
    }
  }
`;

export default Stamps;
