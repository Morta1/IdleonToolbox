import {
  Card,
  CardContent,
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
import React, { useContext, useState } from 'react';
import { notateNumber } from 'utility/helpers';
import { AppContext } from 'components/common/context/AppProvider';
import Tooltip from 'components/Tooltip';
import Button from '@mui/material/Button';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import InfoIcon from '@mui/icons-material/Info';
import Link from '@mui/material/Link';
import { NextSeo } from 'next-seo';
import ConstructionBoard from '../../../components/account/Worlds/World3/ConstructionBoard';
import MenuItem from '@mui/material/MenuItem';
import { optimizeArrayWithSwaps } from '../../../parsers/construction';
import ForwardIcon from '@mui/icons-material/Forward';
import SouthIcon from '@mui/icons-material/South';

import styled from '@emotion/styled';

const Construction = () => {
    const { state } = useContext(AppContext);
    const [view, setView] = useState('build');
    const [showTooltip, setShowTooltip] = useState(true);
    const [stat, setStat] = useState('totalBuildRate');
    const [solveTime, setSolveTime] = useState(2500);
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
      const base = JSON.parse(JSON.stringify(state?.account?.construction?.baseBoard));
      const opt = optimizeArrayWithSwaps(base, stat);
      setMoves({ list: opt?.moves, current: 0 })
      setOptimized(opt);
    }

    return (
      <>
        <NextSeo
          title="Idleon Toolbox | Construction"
          description="Keep track of your construction board, cogs information and more"
        />
        <Typography variant={'h2'} textAlign={'center'} mb={3}>
          Construction
        </Typography>
        <Stack alignItems={'center'}>
          <ToggleButtonGroup value={view} exclusive onChange={(e, value) => (value?.length ? setView(value) : null)}>
            <ToggleButton value="build">Build</ToggleButton>
            <ToggleButton value="buildPercent">Build %</ToggleButton>
            <ToggleButton value="exp">Exp</ToggleButton>
            <ToggleButton value="flaggy">Flaggy</ToggleButton>
            <ToggleButton value="classExp">Class Exp</ToggleButton>
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
          <Stack direction={'row'} my={2} gap={2}>
            <CardTitleAndValue title={'Total Build Speed'}>
              <Stack alignItems={'center'} gap={1}>
                <Typography>{notateNumber(state?.account?.construction?.totalBuildRate)}/HR</Typography>
                {optimized ? <SouthIcon/> : null}
                {optimized
                  ? <Typography sx={{
                    color: 'info.light',
                  }}>{notateNumber(optimized?.totalBuildRate)}/HR
                    (+{notateNumber(optimized?.totalBuildRate - state?.account?.construction?.totalBuildRate)})</Typography>
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
              </Stack>
            </CardTitleAndValue>
            <CardTitleAndValue title={'Optimize'}>
              <Stack gap={1}>
                <TextField onChange={({ target }) => setSolveTime(target.value)} type={'number'}
                           inputProps={{ min: 0 }} variant={'standard'} label={'Solve time (in ms)'}
                           value={solveTime}/>
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
                    {/*<MenuItem value={'totalExpRate'}>Xp bonus</MenuItem>*/}
                  </Select>
                </FormControl>
                <Button variant={'contained'} onClick={handleOptimize}>Optimize</Button>

              </Stack>
            </CardTitleAndValue>
          </Stack>
          <ConstructionBoard view={view} showTooltip={showTooltip}
                             setOutsideHighlight={setOutsideHighlight}
                             relations={current?.relations}
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
          {optimized ? <Typography sx={{ mt: 3 }} variant={'caption'}>* Hovering over a cog in the lower board will reveal
            where the same cog was originally placed on the upper board.</Typography> : null}
          {optimized ? <ConstructionBoard view={view}
                                          outsideHighlight={outsideHighlight}
                                          showTooltip={showTooltip}
                                          relations={optimized?.relations}
                                          board={optimized?.board}/> : null}

        </Stack>
      </>
    );
  }
;

const ReverseForwardIcon = styled(ForwardIcon)`
  transform: rotate(180deg);
`

const CardTitleAndValue = ({ cardSx, title, value, children }) => {
  return <Card sx={{ my: { xs: 0, md: 3 }, width: 'fit-content', ...cardSx }}>
    <CardContent>
      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>{title}</Typography>
      {value ? <Typography>{value}</Typography> : children}
    </CardContent>
  </Card>
}


export default Construction;
