import React from 'react';
import styled from 'styled-components';
import AnvilProducts from "./AnvilProducts";
import { kFormatter, prefix } from "../../../Utilities";
import CoinDisplay from "../../General/CoinDisplay";

const Anvil = ({ anvil, afkTime, lastUpdated }) => {
  const {
    availablePoints,
    pointsFromCoins,
    pointsFromMats,
    xpPoints,
    speedPoints,
    capPoints,
    anvilSpeed,
    anvilCapacity,
    anvilCost,
    // anvilExp
  } = anvil?.stats;

  return (
    <AnvilStyled>
      <div>
        <div>Available Points: {availablePoints}</div>
        <div>Points from materials: {pointsFromMats}</div>
        <div>Points from coins: {pointsFromCoins}</div>
        <div className={'mini-title'}>Invested Points</div>
        <div className={'points'}>
          <div><span>Exp</span> {kFormatter(xpPoints, 2)}</div>
          <div><span>Speed</span> {kFormatter(speedPoints, 2)}</div>
          <div><span>Capacity</span> {kFormatter(capPoints, 2)}</div>
        </div>
        <div className={'mini-title'}>Bonus</div>
        <div className={'points'}>
          <div><span>Exp</span> {kFormatter(0, 2)}</div>
          <div><span>Speed</span> {kFormatter(anvilSpeed, 2)}</div>
          <div><span>Capacity</span> {kFormatter(anvilCapacity, 2)}</div>
        </div>
        <div className={'required-material'}>
          <div><span>Material</span> <img className={'mat-icon'} src={`${prefix}data/${anvilCost?.rawName}.png`}
                                          alt={''}/></div>
          <div><span>Next</span> {kFormatter(anvilCost?.nextMatUpgrade, 2)}</div>
          <div><span>Total</span> {kFormatter(anvilCost?.totalMats)}</div>
        </div>
        <div className={'coins-cost'}>
          <span>Next Coins Cost:</span>
          <CoinDisplay style={{ margin: '10px 0' }} money={anvilCost?.nextCoinUpgrade}/>
        </div>
        <div className={'coins-cost'}>
          <span>Total Coins Spent:</span>
          <CoinDisplay style={{ margin: '10px 0' }} money={anvilCost?.totalCoins}/>
        </div>
      </div>
      <AnvilProducts afkTime={afkTime} anvil={anvil} lastUpdated={lastUpdated}/>
    </AnvilStyled>
  );
};

const AnvilStyled = styled.div`
  justify-self: center;

  .mini-title {
    font-weight: bold;
    border-bottom: 1px solid;
    width: max-content;
  }

  .mat-icon {
    width: 30px;
  }

  .coins-cost {
    margin: 15px 0;
  }

  .required-material, .points {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;

    > div {
      display: flex;
      flex-direction: column;

      > span {
        font-weight: bold;
      }
    }
  }

  .points {
    margin: 5px 0;
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

export default Anvil;
