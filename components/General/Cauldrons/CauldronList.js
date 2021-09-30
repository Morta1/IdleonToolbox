import styled from 'styled-components'
import { cleanUnderscore, prefix } from "../../../Utilities";

const CauldronList = ({ cauldron }) => {
  return (
    <CauldronListStyle>
      {cauldron?.map(({ level, rawName, name }, index) => {
        return <div key={`${name}${index}`} className={'bubble-wrapper'}>
          <span className={'level'}>{level}</span>
          <img title={cleanUnderscore(name)} src={`${prefix}/data/${rawName}.png`}
               alt={''}/>
        </div>
      })}
    </CauldronListStyle>
  );
};

const CauldronListStyle = styled.div`
  flex-basis: 25%;
  text-align: center;

  .bubble-wrapper {
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

export default CauldronList;
