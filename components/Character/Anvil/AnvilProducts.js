import React from 'react';
import { cleanUnderscore, prefix } from "../../../Utilities";
import styled from 'styled-components';
import { LinearProgressWithLabel } from "../../Common/commonStyles";
import Timer from "../../Common/Timer";
import WarningIcon from "@material-ui/icons/Warning";
import NumberTooltip from '../../Common/Tooltips/NumberTooltip';

const AnvilProducts = ({ anvil, afkTime, lastUpdated }) => {
  return (
    <AnvilProductsStyled>
      {anvil?.production?.map(({ rawName, hammers, currentAmount, currentProgress, time }, index) => {
        if (!hammers) return null;
        const timePassed = (new Date().getTime() - afkTime) / 1000;
        const futureProduction = Math.min(Math.round(currentAmount + ((currentProgress + (timePassed * anvil?.stats?.anvilSpeed / 3600)) / time) * (hammers ?? 0)), anvil?.stats?.anvilCapacity);
        const percentOfCap = Math.round(futureProduction / anvil?.stats?.anvilCapacity * 100);
        const timeTillCap = ((anvil?.stats?.anvilCapacity - futureProduction) / (anvil?.stats?.anvilSpeed / 3600 / time * (hammers ?? 0)));
        // console.log({
        //   timePassed,
        //   futureProduction,
        //   percentOfCap,
        //   timeTillCap,
        //   capacity: anvil?.stats?.anvilCapacity,
        //   hammers, currentAmount, currentProgress, time
        // })
        return hammers > 0 ? <div key={rawName + index}>
          <div className={'item'}>
            <img title={cleanUnderscore(rawName)}
                 src={`${prefix}data/${rawName}.png`} alt=""/>
            x{hammers}
          </div>
          <div>
            <LinearProgressWithLabel barcolor={'#d92a57'} barbgcolor={'#dddddd'}
                                     value={percentOfCap}/>
          </div>
          <div className={'timer'}>
            {!anvil?.guild ?
              <NumberTooltip
                title={<div>
                  <div>Inaccurate!</div>
                  If you want to get more accurate results, please use the connect button.
                </div>}>
                <WarningIcon color={'error'} fontSize={'small'}/>
              </NumberTooltip> : null}
            <span style={{ marginRight: 10 }}>Time To Cap:</span>
            <Timer date={new Date().getTime() + (timeTillCap * 1000)} type={'countdown'} placeholder={'Full'}
                   lastUpdated={lastUpdated}/>
          </div>AGro
        </div> : null;
      })}
    </AnvilProductsStyled>
  );
};

const AnvilProductsStyled = styled.div`

  .item {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timer {
    display: flex;
    align-items: center;
  }

  @media (max-width: 750px) {
    img {
      width: 48px;
      height: 48px;
    }
  }

  @media (max-width: 370px) {
    img {
      width: 36px;
      height: 36px;
    }
  }
`;

export default AnvilProducts;
