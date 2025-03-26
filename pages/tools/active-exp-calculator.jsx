import React, { useContext, useEffect, useState } from 'react';
import { kFormatter, prefix, splitTime } from '@utility/helpers';
import styled from '@emotion/styled';
import { Stack, TextField, Typography } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import IconButton from '@mui/material/IconButton';
import { AppContext } from 'components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import Box from '@mui/material/Box';
import CircleTimer from '@components/common/CircleTimer';
import { getExpToLevel } from '@parsers/misc/activeCalculator';

const countdown = 10;
const ActiveXpCalculator = () => {
  const { state } = useContext(AppContext);
  const [charactersList, setCharactersList] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [endExp, setEndExp] = useState(0);
  const [startExp, setStartExp] = useState(0);
  const [goalLevel, setGoalLevel] = useState(0);
  const [targetExp, setTargetExp] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [start, setStart] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const chars = state?.characters?.map(({ name, skillsInfo, classIndex }) => ({
      name,
      classIndex,
      ...skillsInfo?.character
    }))
    const selected = chars?.[0];
    setSelectedChar(selected);
    setStartExp((selected?.exp / selected?.expReq * 100).toFixed(2));
    setEndExp((selected?.exp / selected?.expReq * 100).toFixed(2));
    setGoalLevel(selectedChar?.level + 1);
    setTargetExp(getExpToLevel(selected, goalLevel));
    setCharactersList(chars);
  }, []);

  useEffect(() => {
    if (selectedChar) {
      setGoalLevel(selectedChar?.level + 1);
    }
  }, [selectedChar])

  useEffect(() => {
    setStartExp((selectedChar?.exp / selectedChar?.expReq * 100).toFixed(2));
    setEndExp((selectedChar?.exp / selectedChar?.expReq * 100).toFixed(2));
    if (selectedChar) {
      setTargetExp(getExpToLevel(selectedChar, goalLevel))
    }
    setResult(null);
  }, [selectedChar, goalLevel]);

  const calcTimeToLevelUp = (startExp, endPercentage) => {
    const rawStartExp = targetExp * (parseInt(parseFloat(startExp).toFixed(2).replace('.', '')) / 10000);
    const currentExp = targetExp * (parseInt(parseFloat(endPercentage).toFixed(2).replace('.', '')) / 10000);
    const expNeeded = targetExp;
    const expFarmed = currentExp - rawStartExp;
    const expPerMinute = expFarmed / countdown;
    const timeLeft = expNeeded / expPerMinute / 60;
    return { expFarmed, expPerMinute, expPerHour: expPerMinute * 60, timeLeft: splitTime(timeLeft) };
  }

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
      <NextSeo
        title="Active Exp Calculator | Idleon Toolbox"
        description="Calculate how much experience you get when playing actively"
      />
      {selectedChar ? <Stack gap={5} flexWrap={'wrap'} sx={{ flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
        <div className={'character-wrapper'}>
          <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'}>
            <StyledTextField size={'small'} id="select" label="Character" value={selectedChar || {}}
                             onChange={(e) => setSelectedChar(e.target.value)} select>
              {charactersList?.map((character, index) => {
                return <StyledMenuItem key={character?.name + index} value={character}>
                  <img src={`${prefix}data/ClassIcons${character?.classIndex}.png`} alt="class-icon" width={32} height={32}/>
                  {character?.name}
                </StyledMenuItem>
              })}
            </StyledTextField>
            <IconButton aria-label="start" onClick={onStart}>
              <PlayCircleOutlineIcon/>
            </IconButton>
          </Stack>
          <StyledTextField
            size={'small'}
            label={'Start Percentage'}
            value={startExp || 0}
            type={'number'}
            onChange={(e) => onStartPercentageChange(e.target.value)}/>
          <StyledTextField
            size={'small'}
            label={'End Percentage'}
            value={endExp || 0}
            type={'number'}
            onChange={(e) => onEndPercentageChange(e.target.value)}/>
          <StyledTextField
            size={'small'}
            label={'Goal Level'}
            value={goalLevel || 0}
            type={'number'}
            helperText={`Remaining exp to level: ${kFormatter(targetExp)}`}
            inputProps={{ min: (selectedChar?.level + 1) || 0 }}
            onChange={(e) => setGoalLevel(e.target.value)}/>
          <div className={'details'}>
            <div>Level: {selectedChar?.level}</div>
            <div>Exp: {kFormatter(selectedChar?.exp)} / {kFormatter(selectedChar?.expReq)} ({(selectedChar?.exp / selectedChar?.expReq * 100).toFixed(2)}%)</div>
            {result ? <div>
              <h3>Results</h3>
              <div>Exp farmed: {kFormatter(result?.expFarmed)}</div>
              <div>Exp per minute: {kFormatter(result?.expPerMinute)}</div>
              <div>Exp per hour: {kFormatter(result?.expPerHour)}</div>
              <div>Time to lv up: {result?.timeLeft}</div>
            </div> : null}
          </div>
        </div>
        <CircleTimer key={start} duration={600} isPlaying={isPlaying}/>
        <Box sx={{ width: 200 }}>
          <Typography variant={'caption'}>* Start a 10-minute timer. After the timer ends, you will receive a result
            indicating the progress you've made towards reaching your goal level</Typography>
        </Box>
      </Stack> : null}
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
