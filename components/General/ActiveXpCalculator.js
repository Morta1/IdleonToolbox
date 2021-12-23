import styled from 'styled-components'
import { useEffect, useState } from "react";
import { IconButton, MenuItem, TextField } from "@material-ui/core";
import { kFormatter, prefix, splitTime } from "../../Utilities";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';

const countdown = 10;

const ActiveXpCalculator = ({ userData }) => {
  const [charactersList, setCharactersList] = useState([]);
  const [selectedChar, setSelectedChar] = useState({});
  const [endExp, setEndExp] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [start, setStart] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const chars = userData?.characters?.map(({ name, skillsInfo, class: charClass }) => ({
      name,
      charClass, ...skillsInfo.character
    }))
    const selected = chars?.[0];
    setSelectedChar(selected);
    setEndExp((selected?.exp / selected?.expReq * 100).toFixed(2));
    setCharactersList(chars);
  }, []);

  useEffect(() => {
    setEndExp((selectedChar?.exp / selectedChar?.expReq * 100).toFixed(2));
    setResult(null);
  }, [selectedChar]);

  const calcTimeToLevelUp = (endPercentage) => {
    const { exp, expReq } = selectedChar;
    const currentExp = expReq * (parseInt(parseFloat(endPercentage).toFixed(2).replace('.', '')) / 10000);
    const expNeeded = expReq - exp;
    const expFarmed = currentExp - exp;
    const expPerMinute = expFarmed / countdown;
    const timeLeft = expNeeded / expPerMinute / 60;
    return { expFarmed, expPerMinute, timeLeft: splitTime(timeLeft) };
  }

  const renderTime = ({ remainingTime }) => {
    if (remainingTime === 0) {
      return <div className="timer">Done!</div>;
    }

    return (
      <div className="timer">
        <div className="text">Remaining</div>
        <div className="value">{remainingTime}</div>
        <div className="text">seconds</div>
      </div>
    );
  };

  const onEndPercentageChange = (value) => {
    setEndExp(value);
    const res = calcTimeToLevelUp(value);
    setResult(res?.expFarmed > 0 ? res : null);
    if (res?.expFarmed > 0) {
      setResult(res);
    }
  }

  const onStart = () => {
    setResult(null);
    if (isPlaying) {
      setStart(start => start + 1);
    } else {
      setIsPlaying(true);
    }
  }

  return (
    <ActiveXpCalculatorStyle>
      <div className="wrapper">
        <div className={'character-wrapper'}>
          <div className={'selection'}>
            <StyledTextField id="select" label="Character" value={selectedChar}
                             onChange={(e) => setSelectedChar(e.target.value)} select>
              {charactersList.map((character, index) => {
                return <StyledMenuItem key={character?.name + index} value={character}>
                  <img src={`${prefix}icons/${character?.charClass}_Icon.png`} alt=""/>
                  {character?.name}
                </StyledMenuItem>
              })}
            </StyledTextField>
            <IconButton aria-label="delete" onClick={onStart}>
              <PlayCircleOutlineIcon/>
            </IconButton>
          </div>
          <StyledTextField
            label={'End Percentage'}
            value={endExp}
            type={'number'}
            // inputProps={{ min: min }}
            onChange={(e) => onEndPercentageChange(e.target.value)}/>
          <div className={'details'}>
            <div>Level: {selectedChar?.level}</div>
            <div>Current percentage: {(selectedChar?.exp / selectedChar?.expReq * 100).toFixed(2)}%</div>
            <div>Current exp: {kFormatter(selectedChar?.exp)}</div>
            <div>Required exp to level: {kFormatter(selectedChar?.expReq)}</div>
            {result ? <div>
              <h3>Results</h3>
              <div>Exp farmed: {kFormatter(result?.expFarmed)}</div>
              <div>Exp per minute: {kFormatter(result?.expPerMinute)}</div>
              <div>Time to lv up: {result?.timeLeft}</div>
            </div> : null}
          </div>
        </div>
        <CountdownCircleTimer
          key={start}
          isPlaying={isPlaying}
          duration={600}
          colors={[["#15aee1"]]}
          // onComplete={() => [true, 1000]}
        >
          {renderTime}
        </CountdownCircleTimer>
      </div>
    </ActiveXpCalculatorStyle>
  );
};

const StyledTextField = styled(TextField)`
  && {
    width: 200px;

    .MuiSelect-select {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    label.Mui-focused {
      color: rgba(255, 255, 255, 0.7);
    }
  }
`

const StyledMenuItem = styled(MenuItem)`
  && {
    display: flex;
    gap: 15px
  }
`;

const ActiveXpCalculatorStyle = styled.div`
  padding: 20px;
  margin-top: 15px;
  margin-bottom: 25px;


  .selection {
    display: flex;
    align-items: baseline;
    gap: 15px;
  }


  .wrapper {
    display: flex;
    gap: 50px;
  }

  .character-wrapper {
    align-self: center;
    margin-top: 30px;
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .timer {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: white;
  }

  .text {
    color: white;
  }

  .value {
    font-size: 40px;
  }

  .info {
    max-width: 360px;
    margin: 40px auto 0;
    text-align: center;
    font-size: 16px;
  }
`;

export default ActiveXpCalculator;
