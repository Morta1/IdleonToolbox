import styled from 'styled-components'
import { prefix } from "../../Utilities";

const GeneralInfo = ({ teleports, keys, colosseumTickets, obolFragments, silverPens, money, gems }) => {
  return (
    <GeneralInfoStyle>
      <div className="box coins">
        {[...money]?.reverse()?.map((coin, index) => {
          return <div className={'coin'} key={name + coin}>
            <img src={`${prefix}data/Coins${index + 1}.png`} alt=""/>
            <span className={'coin-value'}>{coin}</span>
          </div>
        })}
      </div>
      <div className="box">
        <img src={`${prefix}data/rtt0.png`} alt=""/>
        <span className={'value'}>{teleports}</span>
      </div>
      <div className="box">
        <img src={`${prefix}data/ObolFrag.png`} alt=""/>
        <span className={'value'}>{obolFragments}</span>
      </div>
      <div className="box">
        <img src={`${prefix}data/TixCol.png`} alt=""/>
        <span className={'value'}>{colosseumTickets}</span>
      </div>
      <div className="box">
        <img src={`${prefix}data/SilverPen.png`} alt=""/>
        <span className={'value'}>{silverPens}</span>
      </div>
      <div className="box">
        <img src={`${prefix}data/PremiumGem.png`} alt=""/>
        <span className={'value'}>{gems}</span>
      </div>
      {keys?.map(({ name, rawName, amount }, index) => {
        return <div key={name + index} className="box">
          <img src={`${prefix}data/${rawName}.png`} alt=""/>
          <span className={'value'}>{amount}</span>
        </div>
      })}
    </GeneralInfoStyle>
  );
};

const GeneralInfoStyle = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 74px);
  grid-template-rows: repeat(1, 50px) repeat(4, 80px);
  justify-content: center;

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

  .coins {
    margin-top: 10px;
    grid-column: span 4;
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-around;
    position: relative;

    .coin {
      position: relative;
      margin-right: 6px;

      .coin-value {
        position: absolute;
        left: 50%;
        bottom: -10px;
        transform: translateX(-50%);
        font-weight: bold;
        background: #000000eb;
        font-size: 13px;
        padding: 0 5px;
        text-align: center;
      }
    }

  }
`;

export default GeneralInfo;
