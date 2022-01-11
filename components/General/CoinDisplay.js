import styled from 'styled-components'
import { prefix } from "../../Utilities";

const CoinDisplay = ({ money, labelPosition = 'bottom', style = {} }) => {
  return (
    <CoinDisplayStyle style={style} labelPosition={labelPosition}>
      {[...money]?.reverse()?.map((coin, index) => {
        return index < 6 && Number(coin) > 0 ? <div className={'coin'} key={coin + '' + index}>
          <img src={`${prefix}data/Coins${index + 1}.png`} alt=""/>
          <span className={'coin-value'}>{Number(coin)}</span>
        </div> : null
      })}
    </CoinDisplayStyle>
  );
};

const CoinDisplayStyle = styled.div`
  ${({ labelPosition }) => `${labelPosition === 'top' ? 'margin-top: 15px;' : ''}`}
  height: max-content;
  grid-column: span 4;
  display: flex;
  flex-direction: row-reverse;
  justify-content: space-around;
  position: relative;

  .coin {
    position: relative;
    margin-right: 5px;

    .coin-value {
      color: white;
      position: absolute;
      left: 50%;
      ${({ labelPosition }) => `${labelPosition === 'bottom' ? 'bottom: -10px;' : 'top: -20px;'}`}
      transform: translateX(-50%);
      font-weight: bold;
      background: #000000eb;
      font-size: 13px;
      padding: 0 5px;
      text-align: center;
    }
  }

`;

export default CoinDisplay;
