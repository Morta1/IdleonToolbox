import { useContext, useEffect, useState } from "react";
import { kFormatter, prefix, splitTime } from "../../utility/helpers";
import styled from "@emotion/styled";
import { Stack, TextField } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import IconButton from "@mui/material/IconButton";
import { AppContext } from "components/common/context/AppProvider";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

const countdown = 10;

const ActiveXpCalculator = () => {
  const { state } = useContext(AppContext);
  const [charactersList, setCharactersList] = useState([]);
  const [selectedChar, setSelectedChar] = useState({});
  const [endExp, setEndExp] = useState(0);
  const [startExp, setStartExp] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [start, setStart] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const chars = state?.characters?.map(({ name, skillsInfo, class: charClass }) => ({
      name,
      charClass, ...skillsInfo.character
    }))
    const selected = chars?.[0];
    setSelectedChar(selected);
    setStartExp((selected?.exp / selected?.expReq * 100).toFixed(2));
    setEndExp((selected?.exp / selected?.expReq * 100).toFixed(2));
    setCharactersList(chars);
  }, []);

  useEffect(() => {
    setStartExp((selectedChar?.exp / selectedChar?.expReq * 100).toFixed(2));
    setEndExp((selectedChar?.exp / selectedChar?.expReq * 100).toFixed(2));
    setResult(null);
  }, [selectedChar]);

  const calcTimeToLevelUp = (startExp, endPercentage) => {
    const { expReq } = selectedChar;
    const rawStartExp = expReq * (parseInt(parseFloat(startExp).toFixed(2).replace('.', '')) / 10000);
    const currentExp = expReq * (parseInt(parseFloat(endPercentage).toFixed(2).replace('.', '')) / 10000);
    const expNeeded = expReq - rawStartExp;
    const expFarmed = currentExp - rawStartExp;
    const expPerMinute = expFarmed / countdown;
    const timeLeft = expNeeded / expPerMinute / 60;
    return { expFarmed, expPerMinute, expPerHour: expPerMinute * 60, timeLeft: splitTime(timeLeft) };
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
    const res = calcTimeToLevelUp(startExp, value);
    setResult(res?.expFarmed > 0 ? res : null);
    if (res?.expFarmed > 0) {
      setResult(res);
    }
  }

  const onStartPercentageChange = (value) => {
    setStartExp(value);
    const res = calcTimeToLevelUp(value, endExp);
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
      <Stack gap={5} flexWrap={'wrap'} sx={{ flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
        <div className={'character-wrapper'}>
          <Stack direction={'row'} flexWrap={'wrap'}>
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
          </Stack>
          <StyledTextField
            label={'Start Percentage'}
            value={startExp}
            type={'number'}
            // inputProps={{ min: min }}
            onChange={(e) => onStartPercentageChange(e.target.value)}/>
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
              <div>Exp per hour: {kFormatter(result?.expPerHour)}</div>
              <div>Time to lv up: {result?.timeLeft}</div>
            </div> : null}
          </div>
        </div>
        <CountdownCircleTimer
          key={start}
          isPlaying={isPlaying}
          duration={600}
          colors={[["#15aee1"]]}
        >
          {renderTime}
        </CountdownCircleTimer>
      </Stack>
    </ActiveXpCalculatorStyle>
  );
};

const StyledTextField = styled(TextField)`
  && {
    width: 230px;

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
