import styled from 'styled-components'
import { cleanUnderscore, kFormatter, numberWithCommas, prefix } from "../../Utilities";
import { growth } from "../General/calculationHelper";
import { Checkbox, FormControlLabel } from "@material-ui/core";
import React, { useEffect, useState } from "react";

const saltColor = ['#EF476F', '#ff8d00', '#00dcff', '#cdff68', '#d822cb', '#9a9ca4']

const Refinery = ({ refinery, saltLicks, vials, characters }) => {
  const { salts, refinerySaltTaskLevel } = refinery || {};
  const [includeSquireCycles, setIncludeSquireCycles] = useState(false);
  const [squiresData, setSquiresData] = useState({ cycles: 0, cooldowns: [] });

  useEffect(() => {
    const squires = characters?.filter((character) => character?.class === 'Squire');
    const squiresDataTemp = squires.reduce((res, character) => {
      const { name, talents, cooldowns, postOffice } = character;
      const magicianBox = postOffice?.boxes?.find((box) => box.name === "Magician_Starterpack");
      const cdReduction = Math.max(0, growth(magicianBox?.func, magicianBox?.level - 100, magicianBox?.x1, magicianBox?.x2));
      const refineryThrottle = talents?.[2]?.orderedTalents.find((talent) => talent?.name === 'REFINERY_THROTTLE');
      let cyclesNum = growth(refineryThrottle?.funcX, refineryThrottle?.level, refineryThrottle?.x1, refineryThrottle?.x2) || 0;
      // const calculatedCooldown = (1 - cdReduction / 100) * (refineryThrottle?.cooldown);
      return {
        cycles: res?.cycles + cyclesNum,
        // cooldowns: [...res?.cooldowns, {
        //   name,
        //   cooldown: calculatedCooldown - cooldowns?.[refineryThrottle?.talentId]
        // }]
      };
    }, { cycles: 0, cooldowns: [] });
    setSquiresData(squiresDataTemp);
  }, []);


  const calcTimeToRankUp = (rank, powerCap, refined) => {
    // Cycles per day = (24 * 60 * 60 / (900 / (1 + VIAL + saltLicks[2]))) + SQUIRE PER
    const powerPerCycle = Math.floor(Math.pow(rank, 1.3));
    const redMaltVial = vials?.[25] ? (growth(vials?.[25]?.func, vials?.[25]?.level, vials?.[25]?.x1, vials?.[25]?.x2) / 100) : 0;
    const saltLickUpgrade = saltLicks?.[2] ? (saltLicks?.[2]?.baseBonus * saltLicks?.[2]?.level / 100) : 0;
    const combustionCyclesPerDay = (24 * 60 * 60 / (900 / (1 + redMaltVial + saltLickUpgrade))) + (includeSquireCycles ? (squiresData?.cycles ?? 0) : 0);
    const timeLeft = ((powerCap - refined) / powerPerCycle) / combustionCyclesPerDay * 24;
    return splitTime(timeLeft);
  };

  const splitTime = (numberOfHours) => {
    const days = Math.floor(numberOfHours / 24);
    const remainder = numberOfHours % 24;
    const hours = Math.floor(remainder);
    const minutes = Math.floor(60 * (remainder - hours));
    return `${days}d:${hours}h:${minutes}m`
  }

  const calcCost = (rank, quantity, item, index) => {
    const isSalt = item?.includes('Refinery');
    return Math.floor(Math.pow(rank, (isSalt && index <= refinerySaltTaskLevel) ? 1.3 : 1.5)) * quantity;
  };

  return (
    <RefineryStyle>
      <div className="wrapper">
        <div className={'cycles'}>
          <div>
            {squiresData?.cooldowns?.map(({ name, cooldown, talentId }, index) => {
              return <div key={name + ' ' + index}>
                {name}
              </div>
            })}
          </div>
          <FormControlLabel
            control={
              <StyledCheckbox
                disabled={squiresData?.cycles === 0}
                checked={includeSquireCycles}
                onChange={() => setIncludeSquireCycles(!includeSquireCycles)}
                name='Include Squire Cycles'
                color='default'
              />
            }
            label={`Include Squire Cycles (${squiresData?.cycles})`}
          />
        </div>
        {salts?.map(({ saltName, refined, powerCap, rawName, rank, active, cost, autoRefinePercentage }, saltIndex) => {
          const rankUp = powerCap === refined;
          const progressPercentage = refined / powerCap * 100;
          return <div className={'salt'} key={`${saltName}-${saltIndex}`}>
            <div className="images">
              <StatusImage status={active} src={`${prefix}data/UIoptionC.png`} title={active ? 'active' : 'inactive'}
                           alt="status"/>
              {rankUp ? <img className={'up'} src={`${prefix}data/up.png`} alt=""/> : null}
              <img src={`${prefix}data/${rawName}.png`} alt=""/>
            </div>
            <div className={'texts'}>
              <div className={'bold'}>{cleanUnderscore(saltName)}</div>
              <div><span className={'bold'}>Power:</span> {numberWithCommas(refined)} / {numberWithCommas(powerCap)}
              </div>
              <div><span className={'bold'}>Rank:</span> {rank}</div>
              <div><span className={'bold'}>Rank Up In: </span>{calcTimeToRankUp(rank, powerCap, refined)}</div>
              <div><span className={'bold'}>Auto Refine:</span> {autoRefinePercentage}%</div>
              <Progress value={progressPercentage} color={saltColor[saltIndex]}>
                <div className="progress-bar2"/>
                {/*<span className={'percentage'}>{parseInt(progressPercentage)}%</span>*/}
              </Progress>
            </div>
            <div className={'requirements'}>
              <div>Components:</div>
              <div className={'items'}>{cost?.map(({ name, rawName, quantity, totalAmount }, index) => {
                return <div className={'item'} key={`${rawName}-${index}`}>
                  <img src={`${prefix}data/${rawName}.png`} alt=""/>
                  <div className={'item-numbers'}>
                    <span>{kFormatter(totalAmount)}</span>
                    <div>
                      <img className={'arrow-down'} style={{ width: 15, height: 15, objectFit: 'contain' }}
                           src={`${prefix}data/UpgArrowG.png`}
                           alt=""/>
                      {calcCost(rank, quantity, rawName, saltIndex)}
                    </div>
                  </div>
                </div>
              })}</div>
            </div>
          </div>
        })}
      </div>
    </RefineryStyle>
  );
};

const RefineryStyle = styled.div`
  display: flex;
  justify-content: center;

  .bold {
    font-weight: bold;
  }

  .cycles {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 15px;
  }

  .salt {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 25px;

    .images {
      display: flex;
      align-items: center;
      position: relative;

      .up {
        position: absolute;
        width: 25px;
        right: 40px;
        top: 0;
      }
    }

    .texts {
      display: flex;
      flex-direction: column;
      gap: 5px;
      width: 320px;
    }

    .requirements {
      .items {
        display: flex;
      }

      .item {
        margin-top: 10px;
        position: relative;
        display: flex;

        .item-numbers {
          display: flex;
          flex-direction: column;

          .arrow-down {
            width: 15px;
            height: 15px;
            object-fit: contain;
            transform: rotate(180deg);
          }
        }

        .quantity {
          position: absolute;
          bottom: 0;
          left: 0;
          font-weight: bold;
          background: #000000eb;
          font-size: 13px;
          padding: 0 5px;
        }
      }

      & img {
        height: 45px;
        width: 45px;
      }
    }
  }
`;

const StatusImage = styled.img`
  filter: hue-rotate(${({ status }) => status ? '136deg' : '0'});
`

const Progress = styled.div`
  position: relative;
  width: 65%;
  height: max-content;
  padding: 6px;
  border-radius: 30px;
  background: rgba(0, 0, 0, 0.25);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25), 0 1px rgba(255, 255, 255, 0.08);

  .percentage {
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    background: black;
  }

  .progress-bar {
    height: 18px;
    background-color: #ee303c;
    border-radius: 4px;
    transition: 0.4s linear;
    transition-property: width, background-color;
  }

  .progress-bar2 {
    height: 18px;
    border-radius: 30px;
    background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
    transition: 0.4s linear;
    width: ${({ value }) => value}%;
    background-color: ${({ color }) => color};
    transition-property: width, background-color;
  }

  @keyframes progressAnimation {
    0% {
      width: 5%;
      background-color: #F9BCCA;
    }
    100% {
      width: 85%;
      background-color: #EF476F;
    }
  }
`;

const StyledCheckbox = styled(Checkbox)`
  && {
    color: white;
  }
`;

export default Refinery;
