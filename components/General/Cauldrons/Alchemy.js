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
          return level > 0 ?
            <div key={`${name}${index}`} className={'vial-wrapper'}>
              <img className={'vial-item'} title={cleanUnderscore(item)} src={`${prefix}/data/${item}.png`}
                   alt={''}/>
              <img key={`${name}${index}`} title={cleanUnderscore(name)} src={`${prefix}/data/aVials${level}.png`}
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

  .vial-wrapper {
    position: relative;

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
