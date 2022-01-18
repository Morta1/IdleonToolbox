import styled from 'styled-components'
import { kFormatter, prefix } from "../Utilities";
import FlagTooltip from "./Common/Tooltips/FlagTooltip";
import { useState } from "react";
import ToggleButton from "@material-ui/lab/ToggleButton";
import { ToggleButtonGroup } from "@material-ui/lab";

const headColor = { blue: 0, green: 300, orange: 220, purple: 130 };
const Flags = ({ flags, characters }) => {
  const [view, setView] = useState('build');
  return (
    <FlagsStyle>
      <div className={'toggle'}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(e, value) => value?.length ? setView(value) : null}
          aria-label="text alignment"
        >
          <ToggleButton value="build" aria-label="left aligned">
            Build
          </ToggleButton>
          <ToggleButton value="exp" aria-label="centered">
            Exp
          </ToggleButton>
          <ToggleButton value="flaggy" aria-label="right aligned">
            Flaggy
          </ToggleButton>
          <ToggleButton value="classExp" aria-label="justified">
            Class Exp
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div className="matrix">
        {flags?.map((flag, index) => {
          const filled = flag?.currentAmount / flag?.requiredAmount * 100;
          const rest = 100 - filled;

          return <FlagTooltip {...flag} key={index}
                              character={flag?.cog?.name?.includes('Player') ? flag?.cog?.name?.split('_')[1] : ''}>
            <Slot filled={filled} rest={rest}>
              {flag?.flagPlaced ? <img src={`${prefix}data/CogFLflag.png`} alt=""/> : null}
              {flag?.cog?.name ?
                <ObjectImage name={flag?.cog?.name}
                             src={`${prefix}data/${flag?.cog?.name?.includes('Player') ? 'headBIG' : flag?.cog?.name}.png`}
                             alt=""/> : null}
              {view === 'build' && !flag?.flagPlaced ?
                <span className={'number'}>{kFormatter(flag?.cog?.stats?.a?.value, 2) ?? null}</span> : null}
              {view === 'exp' && !flag?.flagPlaced ?
                <span
                  className={'number'}>{kFormatter(flag?.cog?.stats?.b?.value, 2) ?? kFormatter(flag?.cog?.stats?.d?.value, 2) ?? null}</span> : null}
              {view === 'flaggy' && !flag?.flagPlaced ?
                <span className={'number'}>{kFormatter(flag?.cog?.stats?.c?.value, 2) ?? null}</span> : null}
              {view === 'classExp' && !flag?.flagPlaced ?
                <span className={'number'}>{kFormatter(flag?.cog?.stats?.j?.value, 2) ?? null}</span> : null}
            </Slot>
          </FlagTooltip>
        })}
      </div>
    </FlagsStyle>
  );
};

const FlagsStyle = styled.div`
  width: 55%;
  margin: 0 auto;

  .toggle {
    display: flex;
    justify-content: center;
    margin-bottom: 50px;
  }

  .matrix {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 25px;
  }
`;

const ObjectImage = styled.img`
  width: 36px;
  height: 36px;
  transform: scale(${({ name }) => name.includes('Player') ? 1 : 1.3});
`

const Slot = styled.div`
  position: relative;
  width: 36px;
  height: 36px;
  transform: scale(1.3);
  background-image: url(${() => `${prefix}data/CogSq0.png`});

  .number {
    font-size: 10px;
    position: absolute;
    top: 0;
    left: 0;
    font-weight: bold;
    background-color: #000000c7;
  }


  &:before {
    content: "";
    display: block;
    position: absolute;
    z-index: -1;
    ${({
         filled,
         rest
       }) => filled === 0 || filled === 100 ? '' : `background: linear-gradient(to top, #9de060 ${filled}%, transparent 0%);`}

    width: 40px;
    height: 41px;
    top: -3px;
    left: -2px;
  }
`;

export default Flags;
