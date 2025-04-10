import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../../common/context/AppProvider';
import { optimizeArrayWithSwaps } from '../../../../../parsers/construction';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import Tooltip from '../../../../Tooltip';
import Link from '@mui/material/Link';
import InfoIcon from '@mui/icons-material/Info';
import Button from '@mui/material/Button';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { CardTitleAndValue } from '../../../../common/styles';
import { notateNumber } from '../../../../../utility/helpers';
import SouthIcon from '@mui/icons-material/South';
import MenuItem from '@mui/material/MenuItem';
import ConstructionBoard from './ConstructionBoard';

const ConstructionMain = () => {
  const { state } = useContext(AppContext);
  const [view, setView] = useState('build');
  const [showTooltip, setShowTooltip] = useState(true);
  const [roundedValues, setRoundedValues] = useState(true);
  const [stat, setStat] = useState('totalBuildRate');
  const [computeTime, setComputeTime] = useState(2500);
  const [current, setCurrent] = useState(state?.account?.construction);
  const [optimized, setOptimized] = useState(null);
  const [outsideHighlight, setOutsideHighlight] = useState(null);
  const [moves, setMoves] = useState({
    list: [],
    current: 0
  });

  const handleCopy = async (data) => {
    try {
      await navigator.clipboard.writeText(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (stat === 'totalBuildRate'){
      setView('build')
    } else if (stat === 'totalPlayerExpRate'){
      setView('exp')
    }
  }, [stat])

  // function applyMove(board, from, to) {
  //   const newBoard = [...board];
  //   const tempCog = newBoard[from].cog;
  //   newBoard[from].cog = newBoard[to].cog;
  //   newBoard[to].cog = tempCog;
  //   return newBoard;
  // }

  // const handleNextMove = () => {
  //   if (moves.current >= moves.list.length - 1) return null;
  //   setMoves({ ...moves, current: moves.current + 1 });
  //   const { from, to } = moves.list[moves.current];
  //   const temp = applyMove(current?.board, from, to);
  //   setCurrent({ ...current, board: temp });
  // }
  //
  // const handlePrevMove = () => {
  //   if (moves.current <= 0) return null;
  //   setMoves({ ...moves, current: moves.current - 1 });
  //   const { from, to } = moves.list?.[moves.current - 1];
  //   const temp = applyMove(current?.board, to, from);
  //   setCurrent({ ...current, board: temp });
  // }

  const handleOptimize = () => {
    setCurrent(state?.account?.construction)
    const base = structuredClone((state?.account?.construction?.baseBoard));
    const opt = optimizeArrayWithSwaps(base, stat, computeTime, state?.characters);
    setMoves({ list: opt?.moves, current: 0 })
    setOptimized(opt);
  }

  return (
    <>
      <Stack alignItems={'center'}>
        <ToggleButtonGroup value={view} exclusive onChange={(e, value) => (value?.length ? setView(value) : null)}>
          <ToggleButton value="build">Build</ToggleButton>
          <ToggleButton value="buildPercent">Build %</ToggleButton>
          <ToggleButton value="exp">Exp</ToggleButton>
          <ToggleButton value="playerExp">Player Exp boost</ToggleButton>
          <ToggleButton value="flaggy">Flaggy</ToggleButton>
        </ToggleButtonGroup>
        <Stack my={1}>
          <Stack my={1} gap={1} direction={'row'} alignItems={'center'} justifyContent={'center'}>
            <Typography variant={'h6'} textAlign={'center'}>
              Cogstruction{' '}
            </Typography>
            <Tooltip
              followCursor={false}
              title={
                <>
                  You can export your data and use it in{' '}
                  <Link target={'_blank'} underline={'always'} color={'info.dark'}
                        href="https://github.com/automorphis/Cogstruction" rel="noreferrer">
                    Cogstruction
                  </Link>
                </>
              }
            >
              <InfoIcon/>
            </Tooltip>
          </Stack>
          <Stack direction={'row'} gap={2}>
            <Button variant={'contained'} color={'primary'} sx={{ textTransform: 'unset' }}
                    onClick={() => handleCopy(state?.account?.construction?.cogstruction?.cogData)}
                    startIcon={<FileCopyIcon/>}>
              Cogstruction Data
            </Button>
            <Button variant={'contained'} color={'primary'} sx={{ textTransform: 'unset' }}
                    onClick={() => handleCopy(state?.account?.construction?.cogstruction?.empties)}
                    startIcon={<FileCopyIcon/>}>
              Cogstruction Empties
            </Button>
          </Stack>
        </Stack>
        <Stack direction={'row'} my={2} gap={2} flexWrap={'wrap'}>
          <CardTitleAndValue title={'Total Build Rate'}>
            <Stack alignItems={'center'} gap={1}>
              <Typography>{notateNumber(state?.account?.construction?.totalBuildRate)}/HR</Typography>
              {optimized ? <SouthIcon/> : null}
              {optimized
                ? <Typography sx={{
                  color: 'info.light',
                }}>{notateNumber(optimized?.totalBuildRate)}/HR
                  ({notateNumber(optimized?.totalBuildRate - state?.account?.construction?.totalBuildRate)})</Typography>
                : null}
            </Stack>
          </CardTitleAndValue>
          <CardTitleAndValue title={'Total Player XP rate'}>
            <Stack alignItems={'center'} gap={1}>
              <Typography>{notateNumber(state?.account?.construction?.totalPlayerExpRate)}/HR</Typography>
              {optimized ? <SouthIcon/> : null}
              {optimized
                ? <Typography sx={{
                  color: 'info.light',
                }}>{notateNumber(optimized?.totalPlayerExpRate)}/HR
                  ({notateNumber(optimized?.totalPlayerExpRate - state?.account?.construction?.totalPlayerExpRate)})</Typography>
                : null}
            </Stack>
          </CardTitleAndValue>
          <CardTitleAndValue title={'Player XP Bonus'}
                             value={`${notateNumber(state?.account?.construction?.totalExpRate)}%`}/>
          <CardTitleAndValue title={'Flaggy Rate'}
                             value={`${notateNumber(state?.account?.construction?.totalFlaggyRate)}/HR`}/>
          <CardTitleAndValue title={'Hover'}>
            <Stack sx={{ maxWidth: 200 }}>
              <FormControlLabel
                control={<Checkbox checked={showTooltip} onChange={() => setShowTooltip(!showTooltip)}/>}
                name={'showTooltip'}
                label="Show tooltip"
              />
              <FormControlLabel
                control={<Checkbox checked={roundedValues} onChange={() => setRoundedValues(!roundedValues)}/>}
                name={'roundedValues'}
                label="Rounded Values"
              />
            </Stack>
          </CardTitleAndValue>
          <CardTitleAndValue title={'Optimize'}>
            <Stack gap={1}>
              <TextField onChange={({ target }) => setComputeTime(target.value)} type={'number'}
                         inputProps={{ min: 0 }} variant={'standard'} label={'Compute time (in ms)'}
                         value={computeTime}/>
              <FormControl fullWidth size={'small'} variant="standard">
                {/*<InputLabel id="stat">Stat</InputLabel>*/}
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={stat}
                  label="Age"
                  onChange={(e) => setStat(e.target.value)}
                >
                  <MenuItem value={'totalBuildRate'}>Build speed</MenuItem>
                  <MenuItem value={'totalPlayerExpRate'}>Player XP rate</MenuItem>
                  {/*<MenuItem value={'totalCharacterExp'}>Total character XP</MenuItem>*/}
                </Select>
              </FormControl>
              <Button variant={'contained'} onClick={handleOptimize}>Optimize</Button>

            </Stack>
          </CardTitleAndValue>
        </Stack>
        <ConstructionBoard view={view} showTooltip={showTooltip}
                           roundedValues={roundedValues}
                           setOutsideHighlight={setOutsideHighlight}
                           move={moves.list[moves.current]}
                           board={current?.board}/>
        {/*{optimized ? <Stack direction={'row'} alignItems={'center'} justify-content={'space-between'}>*/}
        {/*  <IconButton onClick={handlePrevMove}>*/}
        {/*    <ReverseForwardIcon/>*/}
        {/*  </IconButton>*/}
        {/*  {moves.current + 1} / {moves.list.length}*/}
        {/*  <IconButton onClick={handleNextMove}>*/}
        {/*    <ForwardIcon/>*/}
        {/*  </IconButton>*/}
        {/*</Stack> : null}*/}
        {optimized ? <Typography sx={{ mt: 3 }} variant={'caption'}>* Hovering over a cog in the upper board will reveal
          where the same cog is placed on the lower board.</Typography> : null}
        {optimized ? <ConstructionBoard view={view}
                                        outsideHighlight={outsideHighlight}
                                        showTooltip={showTooltip}
                                        board={optimized?.board}/> : null}

      </Stack>
    </>
  );
}

export default ConstructionMain;
