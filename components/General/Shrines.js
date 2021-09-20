import styled from 'styled-components'
import { cleanUnderscore, prefix } from "../../Utilities";

const Shrines = ({ shrines }) => {
  return (
    <ShrinesStyle>
      {shrines.map(({ name, rawName, shrineLevel }, index) => {
        return <div className={'shrine-container'} key={name + index}>
          <span className={'level'}>{shrineLevel}</span>
          <img title={cleanUnderscore(name)} src={`${prefix}data/${rawName}.png`} alt=""/>
        </div>
      })}
    </ShrinesStyle>
  );
};

const ShrinesStyle = styled.div`
  display: grid;
  flex-wrap: wrap;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: max-content;
  justify-items: center;
  row-gap: 15px;
  column-gap: 10px;


  .shrine-container {
    position: relative;
    display: inline-block;
    height: max-content;

    .level {
      position: absolute;
      font-weight: bold;
      background: #000000eb;
      font-size: 13px;
      padding: 0 5px;
      text-align: center;
      left: 50%;
      transform: translateX(-50%);
      top: -10px;
    }
  }
`;

export default Shrines;
