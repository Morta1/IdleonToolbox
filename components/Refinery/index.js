import styled from 'styled-components'
import { cleanUnderscore, kFormatter, numberWithCommas, prefix } from "../../Utilities";
import { growth } from "../General/calculationHelper";
import { Checkbox, FormControlLabel, Tooltip } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import InfoIcon from '@material-ui/icons/Info';
import Timer from "../Common/Timer";
import WarningIcon from '@material-ui/icons/Warning';
import NumberTooltip from "../Common/Tooltips/NumberTooltip";

const saltColor = ['#EF476F', '#ff8d00', '#00dcff', '#cdff68', '#d822cb', '#9a9ca4']

const Refinery = ({ refinery, saltLicks, vials, characters, lastUpdated }) => {
  const { salts, refinerySaltTaskLevel } = refinery || {};
  const [includeSquireCycles, setIncludeSquireCycles] = useState(false);
  const [squiresCycles, setSquiresCycles] = useState(0);
  const [squiresCooldown, setSquiresCooldown] = useState([]);

  useEffect(() => {
    const squires = characters?.filter((character) => character?.class === 'Squire');
    const squiresDataTemp = squires.reduce((res, character) => {
      const { name, talents, cooldowns, postOffice, afkTime } = character;
      const magicianBox = postOffice?.boxes?.find((box) => box.name === "Magician_Starterpack");
      const cooldownBonus = magicianBox?.upgrades?.find(({ bonus }) => bonus === '%_Faster_Cooldowns');
      const cdReduction = Math.max(0, growth(cooldownBonus?.func, magicianBox?.level - 100, cooldownBonus?.x1, cooldownBonus?.x2));
      const refineryThrottle = talents?.[2]?.orderedTalents.find((talent) => talent?.name === 'REFINERY_THROTTLE');
      let cyclesNum = 0;
      if (refineryThrottle?.maxLevel > 0) {
        cyclesNum = growth(refineryThrottle?.funcX, refineryThrottle?.maxLevel, refineryThrottle?.x1, refineryThrottle?.x2) || 0;
      }
      // 72000 (s) - cooldowns?.[refineryThrottle?.talentId] (s) - timePassed
      const timePassed = (new Date().getTime() - afkTime) / 1000;
      const calculatedCooldown = (1 - cdReduction / 100) * (cooldowns?.[130]);
      const actualCd = calculatedCooldown - timePassed;
      return {
        cycles: res?.cycles + cyclesNum,
        cooldowns: [...res?.cooldowns, {
          name,
          cooldown: actualCd < 0 ? actualCd : new Date().getTime() + (actualCd * 1000)
        }]
      };
    }, { cycles: 0, cooldowns: [] });
    setSquiresCycles(squiresDataTemp?.cycles);
    setSquiresCooldown(squiresDataTemp?.cooldowns);
  }, [lastUpdated]);


  const calcTimeToRankUp = (rank, powerCap, refined, index) => {
    // Cycles per day = (24 * 60 * 60 / ((900 || 3600) / (1 + VIAL + saltLicks[2]))) + SQUIRE PER
    const powerPerCycle = Math.floor(Math.pow(rank, 1.3));
    const redMaltVial = vials?.[25] ? (growth(vials?.[25]?.func, vials?.[25]?.level, vials?.[25]?.x1, vials?.[25]?.x2) / 100) : 0;
    const saltLickUpgrade = saltLicks?.[2] ? (saltLicks?.[2]?.baseBonus * saltLicks?.[2]?.level / 100) : 0;
    const cycleByType = index <= 2 ? 900 : 3600;
    const combustionCyclesPerDay = (24 * 60 * 60 / (cycleByType / (1 + redMaltVial + saltLickUpgrade))) + (includeSquireCycles ? (squiresCycles ?? 0) : 0);
    const timeLeft = ((powerCap - refined) / powerPerCycle) / combustionCyclesPerDay * 24;
    return new Date().getTime() + (timeLeft * 3600 * 1000);
  };

  const calcResourceToRankUp = (rank, refined, powerCap, itemCost) => {
    const powerPerCycle = Math.floor(Math.pow(rank, 1.3));
    const remainingProgress = powerCap - refined;
    return (remainingProgress / powerPerCycle) * itemCost;
  }

  const calcCost = (rank, quantity, item, index) => {
    const isSalt = item?.includes('Refinery');
    return Math.floor(Math.pow(rank, (isSalt && index <= refinerySaltTaskLevel) ? 1.3 : 1.5)) * quantity;
  };

  return (
    <RefineryStyle>
      <div className="wrapper">
        <div className={'cycles'}>
          <div className={'squires'}>
            {squiresCooldown?.map(({ name, cooldown, talentId }, index) => {
              return <div className={'squire'} key={name + ' ' + index}>
                <img src={`${prefix}data/UISkillIcon130.png`} alt=""/>
                <div className={'details'}>
                  <span>{name}</span>
                  <Timer placeholder={<span style={{ color: '#51e406', fontWeight: 'bold' }}>Ready</span>}
                         type={'countdown'} date={cooldown} lastUpdated={lastUpdated}/>
                </div>
              </div>
            })}
          </div>
          <div className={'squire-cycles'}>
            <FormControlLabel
              control={
                <StyledCheckbox
                  disabled={squiresCycles === 0}
                  checked={includeSquireCycles}
                  onChange={() => setIncludeSquireCycles(!includeSquireCycles)}
                  name='Include Squire Cycles'
                  color='default'
                />
              }
              label={`Include Squire Cycles (${squiresCycles})`}
            />
            <Tooltip title={"Based on max level of the skill "}>
              <InfoIcon/>
            </Tooltip>
          </div>
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
              <div><span className={'bold'}>Rank Up In: </span> <Timer
                type={'countdown'}
                lastUpdated={lastUpdated}
                pause={!active}
                date={calcTimeToRankUp(rank, powerCap, refined, saltIndex)}/></div>
              <div><span className={'bold'}>Auto Refine:</span> {autoRefinePercentage}%</div>
              <Progress value={progressPercentage} color={saltColor[saltIndex]}>
                <div className="progress-bar2"/>
                {/*<span className={'percentage'}>{parseInt(progressPercentage)}%</span>*/}
              </Progress>
            </div>
            <div className={'materials'}>
              <div className={'requirements'}>
                <div>Components Per Cycle:</div>
                <div className={'items'}>{cost?.map(({ name, rawName, quantity, totalAmount }, index) => {
                  const cost = calcCost(rank, quantity, rawName, saltIndex);
                  return <div className={'item'} key={`${rawName}-${index}`}>
                    <img src={`${prefix}data/${rawName}.png`} alt=""/>
                    <div className={'item-numbers'}>
                      <div className={'total-amount'}>
                      </div>
                      <div>
                        {cost}
                      </div>
                    </div>
                  </div>
                })}
                </div>
              </div>
              <div className={'requirements'}>
                <div>Cost To Rank Up:</div>
                <div className={'items'}>{cost?.map(({ name, rawName, quantity, totalAmount }, index) => {
                  let cost = calcCost(rank, quantity, rawName, saltIndex);
                  cost = calcResourceToRankUp(rank, refined, powerCap, cost);
                  return <div className={'item'} key={`${rawName}-${index}`}>
                    {active && cost > totalAmount ?
                      <NumberTooltip title={`Missing ${cleanUnderscore(name)}`}>
                        <WarningIcon color={'error'} fontSize={'small'}/>
                      </NumberTooltip> : null}
                    <img src={`${prefix}data/${rawName}.png`} alt=""/>
                    <div className={'item-numbers'}>
                      <div className={'total-amount'}>
                        <span>{kFormatter(cost)}</span>
                        <div className={cost > totalAmount ? 'missing' : ''}>({kFormatter(totalAmount)})</div>
                      </div>
                    </div>
                  </div>
                })}
                </div>
              </div>
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

  .missing {
    color: #fa4e4e;
  }

  .bold {
    font-weight: bold;
  }

  .squires {
    display: flex;
    gap: 15px;

    .squire {
      display: flex;
      gap: 15px;
      align-items: center;

      .details {
        display: flex;
        flex-direction: column;
      }
    }
  }

  .squire-cycles {
    margin-top: 15px;
    display: flex;
    align-items: center;
  }

  .cycles {
    display: flex;
    flex-direction: column;
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

    .materials {
      display: flex;
      gap: 100px;
    }

    .requirements {
      .items {
        display: flex;
        flex-wrap: wrap;
        max-height: 135px;
        flex-direction: column;
        gap: 15px;
      }

      .item {
        margin-top: 10px;
        position: relative;
        display: flex;
        align-items: center;

        .item-numbers {
          display: flex;
          flex-direction: column;
          justify-content: center;

          .total-amount {
          }

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

// const ArrowImage = styled.img`
//   filter: hue-rotate(${({ status }) => status ? '230deg' : '0'});
// `;

const StatusImage = styled.img`
  filter: hue-rotate(${({ status }) => status ? '136deg' : '0'});
`;

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
