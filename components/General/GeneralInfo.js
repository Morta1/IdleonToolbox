import styled from 'styled-components'
import { prefix } from "../../Utilities";

const GeneralInfo = ({ teleports, keys, colosseumTickets, obolFragments, silverPens }) => {
  return (
    <GeneralInfoStyle>
      <div className="box">
        <img src={`${prefix}/data/rtt0.png`} alt=""/>
        <span className={'value'}>{teleports}</span>
      </div>
      <div className="box">
        <img src={`${prefix}/data/ObolFrag.png`} alt=""/>
        <span className={'value'}>{obolFragments}</span>
      </div>
      <div className="box">
        <img src={`${prefix}/data/TixCol.png`} alt=""/>
        <span className={'value'}>{colosseumTickets}</span>
      </div>
      <div className="box">
        <img src={`${prefix}/data/SilverPen.png`} alt=""/>
        <span className={'value'}>{silverPens}</span>
      </div>
      {keys?.map(({ name, rawName, amount }, index) => {
        return <div key={name + index} className="box">
          <img src={`${prefix}/data/${rawName}.png`} alt=""/>
          <span className={'value'}>{amount}</span>
        </div>
      })}
    </GeneralInfoStyle>
  );
};

const GeneralInfoStyle = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 74px);
  grid-template-rows: max-content;

  .box {
    position: relative;
    height: max-content;

    .value {
      position: absolute;
      font-weight: bold;
      background: #000000eb;
      font-size: 13px;
      padding: 0 5px;
      text-align: center;
      right: 0;
      bottom: 0;
    }
  }
`;

export default GeneralInfo;
