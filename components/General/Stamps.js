import { cleanUnderscore, prefix } from "../../Utilities";
import styled from 'styled-components';

const Stamps = ({ stamps }) => {
  return (
    <StampsWrapper>
      <div className={'stamp-group'}>
        {stamps?.map(({ name, rawName, level }, index) => {
          return name !== 'FILLER' && name !== 'Blank' ?
            <div key={name + index} className={'stamp-wrapper'}>
              {level !== '0' ? <span className={'level'}>{level}</span> : null}
              <img className={`${level === '0' && 'missing'}`} title={cleanUnderscore(name)} src={`${prefix}data/${rawName}.png`} alt=""/>
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
    grid-template-columns: repeat(4, minmax(48px, 72px));
    grid-template-rows: repeat(auto-fit, minmax(48px, 72px));
  }

  .missing {
    filter: ${({ exists }) => exists ? 'grayscale(0)' : 'grayscale(1)'};
    opacity: ${({ exists }) => exists ? '1' : '0.3'};
  }
  
  .stamp-wrapper {
    display: inline-block;
    position: relative;
    
    .level {
      position: absolute;
      top: -10px;
      right: 0;
      font-weight: bold;
      background: #000000eb;
      font-size: 13px;
      padding: 0 5px;
    }
  }
`;

export default Stamps;
