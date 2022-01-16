import { prefix } from "../Utilities";
import styled from 'styled-components';
import Unavailable from "./Common/Unavailable";

const Forge = ({ forge }) => {
  return (
    <ForgeStyle>
      {!forge ? <Unavailable /> : null}
      {forge?.map(({ ore, barrel, bar }, index) => {
        return <div className={'row'} key={`${ore}-${barrel}-${bar}-${index}`}>
          {ore?.rawName !== 'Blank' ? <div className={'slot'}>
            <img src={`${prefix}data/${ore?.rawName}.png`} alt=""/>
            <span className={'quantity'}>{ore?.quantity ?? 0}</span>
          </div> : <div className={'placeholder'}/>}
          {barrel?.rawName !== 'Blank' ? <div className={'slot'}>
            <img src={`${prefix}data/${barrel?.rawName}.png`} alt=""/>
            <span className={'quantity'}>{barrel?.quantity ?? 0}</span>
          </div> : <div className='placeholder'/>}
          {bar?.rawName !== 'Blank' ? <div className={'slot'}>
            <img src={`${prefix}data/${bar?.rawName}.png`} alt=""/>
            <span className={'quantity'}>{bar?.quantity ?? 0}</span>
          </div> : <div className='placeholder'/>}
        </div>
      })}
    </ForgeStyle>
  );
};

const ForgeStyle = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: center;
  height: calc(72px * 8);

  .row {
    display: flex;
  }

  .slot {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .placeholder {
    width: 72px;
    height: 72px;
  }

  .quantity {
    //position: absolute;
    width: max-content;
    font-weight: bold;
    background: #000000eb;
    font-size: 13px;
    padding: 0 5px;
  }
`;

export default Forge;
