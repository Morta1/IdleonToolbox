import ChipTooltip from "../Common/Tooltips/ChipTooltip";
import { prefix } from "../../Utilities";
import { Container } from "@material-ui/core";
import styled from 'styled-components';
import React from "react";

const chipSlotReq = [5, 10, 15, 25, 35, 50, 75];
const Console = ({ chips, playersChips, characters }) => {
  return (
    <ConsoleStyle>
      <Container className={'players-chips'}>
        <div className="players">
          {playersChips?.map((playerChips, index) => {
            const playerName = characters?.[index]?.name;
            const charClassName = characters?.[index]?.class;
            const playerLabLevel = characters?.[index]?.skillsInfo?.laboratory?.level ?? 0;
            return <div className={'player-chips'} key={`player-${index}`}>
              <img className={'class-icon'} src={`${prefix}icons/${charClassName}_Icon.png`} alt=""/>
              <span className={'character-name'}>{playerName}</span>
              {playerChips?.map((chip, chipIndex) => {
                const isSlotAvailable = playerLabLevel >= chipSlotReq[chipIndex];
                return isSlotAvailable ? <div className={'box'} key={`${chip?.name}-${chipIndex}`}>
                  {chip !== -1 ? <ChipTooltip {...chip} >
                    <img src={`${prefix}data/ConsoleChip${chip?.index}.png`} alt=""/>
                  </ChipTooltip> : null}
                </div> : <div key={`locked-${chipIndex}`} className={'box'}>
                  Lv. {chipSlotReq?.[chipIndex]}
                </div>
              })}
            </div>
          })}
        </div>
      </Container>
      <Container className={'chips'}>
        {chips?.map((chip, index) => {
          return <div className={'chip'} key={`${chip?.name}-${index}`}>
            {chip?.amount >= 0 ? <div className="amount">{chip?.amount}</div> : null}
            <ChipTooltip {...chip} >
              <img className={`${chip?.amount < 0 ? 'unacquired' : ''}`} src={`${prefix}data/ConsoleChip${index}.png`}
                   alt=""/>
            </ChipTooltip>
          </div>
        })}
      </Container>

    </ConsoleStyle>
  );
};

const ConsoleStyle = styled.div`
  .players-chips {
    margin-bottom: 50px;

    .players {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;

      .class-icon {
        object-fit: contain;
      }

      .character-name {
        min-width: 150px;
        align-self: center;
      }

      .player-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;

        .box {
          width: 45px;
          height: 45px;
          border: 1px solid white;
          text-align: center;
        }
      }
    }
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 30px;
    margin-bottom: 50px;
  }

  .chip {
    position: relative;

    .amount {
      position: absolute;
      font-weight: bold;
      background: #000000eb;
      font-size: 13px;
      padding: 0 5px;
      text-align: center;
      left: 50%;
      transform: translateX(-50%);
      bottom: -10px;
    }
  }

  .unacquired {
    filter: grayscale(.8);
  }
`;

export default Console;
