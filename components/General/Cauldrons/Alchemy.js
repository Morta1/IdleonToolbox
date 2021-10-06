import styled from 'styled-components'
import CauldronList from "./CauldronList";
import { cleanUnderscore, prefix } from "../../../Utilities";

const Alchemy = ({ cauldrons, vials }) => {
  return (
    <AlchemyStyle>
      <div className={'cauldrons'}>
        <CauldronList cauldron={cauldrons?.power}/>
        <CauldronList cauldron={cauldrons?.quicc}/>
        <CauldronList cauldron={cauldrons?.['high-iq']}/>
        <CauldronList cauldron={cauldrons?.kazam}/>
      </div>
      <div className="vials">
        {vials?.map(({ name, level, item }, index) => {
          return item ? <div key={`${name}${index}`} className={`vial-wrapper${level === '0' ? ' missing' : ''}`}>
            {level !== '0' ? <span className={'level'}>{level}</span> : null}
            <img className={'vial-item'} title={cleanUnderscore(item)} src={`${prefix}data/${item}.png`}
                 alt={''}/>
            <img key={`${name}${index}`} title={cleanUnderscore(name)}
                 src={`${prefix}data/aVials${level === '0' ? '1' : level}.png`}
                 alt={''}/>
          </div> : null
        })}
      </div>
    </AlchemyStyle>
  );
};

const AlchemyStyle = styled.div`
  padding-left: 10px;
  margin-top: 25px;

  .cauldrons, .vials {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 25px;
  }


  .missing {
    filter: grayscale(1);
    opacity: 0.3;
  }

  .vial-wrapper {
    position: relative;
    
    .level{
      position: absolute;
      font-weight: bold;
      background: #000000eb;
      font-size: 13px;
      padding: 5px 8px;
      top: 3px;
      right: 5px;
      border-radius: 50%;
    }
    
    .vial-item {
      position: absolute;
      width: 56px;
      height: 56px;
      bottom: 35px;
      left: 20px;
    }
  }
`;

export default Alchemy;
