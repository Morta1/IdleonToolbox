import {
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import React, { useContext, useState } from 'react';
import { cleanUnderscore, kFormatter, notateNumber, prefix, isProd } from 'utility/helpers';
import { AppContext } from 'components/common/context/AppProvider';
import styled from '@emotion/styled';
import Tooltip from 'components/Tooltip';
import Button from '@mui/material/Button';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import InfoIcon from '@mui/icons-material/Info';
import Link from '@mui/material/Link';
import { NextSeo } from 'next-seo';

const bonusTextSx = {
  fontSize: 12,
  fontWeight: 400,
  position: 'absolute',
  top: 0,
  left: 0,
  backgroundColor: 'black'
};

const indexSx = {
  fontSize: 12,
  fontWeight: 400,
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: 'blue'
};

const Construction = () => {
  const { state } = useContext(AppContext);
  const [view, setView] = useState('build');
  const [showTooltip, setShowTooltip] = useState(true);
  const [highlighted, setHighlighted] = useState({});

  const handleCopy = async (data) => {
    try {
      await navigator.clipboard.writeText(data);
    } catch (err) {
      console.error(err);
    }
  };

  const onSlotEnter = (index) => {
    setHighlighted(state?.account?.construction?.relations?.[index]?.toSimpleObject());
  }
  const onSlotLeave = () => {
    setHighlighted({});
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
          <CardTitleAndValue title={'Total Build Speed'}
                             value={`${notateNumber(state?.account?.construction?.totalBuildRate)}/HR`}/>
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
        </Stack>
        <Typography variant={'caption'}>* Hovering over a cog will display the cogs that influence the selected
          cog</Typography>
        <Box
          mt={3}
          sx={{
            display: 'grid',
            gap: '8px',
            gridTemplateColumns: { xs: 'repeat(8, minmax(45px, 1fr))', md: 'repeat(12, minmax(45px, 1fr))' },
            gridTemplateRows: { xs: 'repeat(8, minmax(45px, 1fr))', md: 'repeat(12, minmax(45px, 1fr))' },
          }}
        >
          {state?.account?.construction?.board?.map((slot, index) => {
            const { currentAmount, requiredAmount, flagPlaced, cog } = slot;
            const { a: buildRate, e: buildPercent, b: exp, d: secondExp, c: flaggyRate, j: classExp } = cog?.stats;
            const filled = (currentAmount / requiredAmount) * 100;
            const rest = 100 - filled;
            return (
              <Box key={index} sx={{ outline: highlighted?.[index] ? '1px solid red' : '' }}
                   onMouseEnter={() => onSlotEnter(index)} onMouseLeave={onSlotLeave}
              >
                <Tooltip title={showTooltip ? <CogTooltip {...slot} index={index}
                                                          character={cog?.name?.includes('Player')
                                                            ? cog?.name?.split('Player_')[1]
                                                            : ''}/> : ''}>
                  <SlotBackground filled={filled} rest={rest}>
                    {flagPlaced ? <FlagIcon src={`${prefix}data/CogFLflag.png`} alt=""/> : null}
                    {cog?.name && !flagPlaced ?
                      <SlotIcon src={`${prefix}data/${cog?.name?.includes('Player') ? 'headBIG' : cog?.name}.png`}
                                alt=""/> : null}
                    {!isProd ? <Typography sx={indexSx}>{index}</Typography> : null}
                    {view === 'build' && !flagPlaced
                      ?
                      <Typography sx={bonusTextSx}>{notateNumber(buildRate?.value, 'Big') ?? null}</Typography>
                      : null}
                    {view === 'buildPercent' && !flagPlaced
                      ?
                      <Typography sx={bonusTextSx}>{notateNumber(buildPercent?.value, 'Big') ?? null}</Typography>
                      : null}
                    {view === 'exp' && !flagPlaced
                      ? <Typography
                        sx={bonusTextSx}>{notateNumber(exp?.value, 'Big') ?? notateNumber(secondExp?.value, 'Big') ?? null}</Typography>
                      : null}
                    {view === 'flaggy' && !flagPlaced
                      ?
                      <Typography sx={bonusTextSx}>{notateNumber(flaggyRate?.value, 'Big') ?? null}</Typography>
                      : null}
                    {view === 'classExp' && !flagPlaced
                      ?
                      <Typography sx={bonusTextSx}>{notateNumber(classExp?.value, 'Big') ?? null}</Typography>
                      : null}
                  </SlotBackground>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      </Stack>
    </>
  );
};

const CogTooltip = ({ character, index, currentAmount, requiredAmount, cog }) => {
  return (
    <>
      {character ? <Typography sx={{ fontWeight: 'bold' }}>{character}</Typography> : null}
      {currentAmount < requiredAmount ? (
        <Typography>
          {kFormatter(currentAmount, 2)} / {kFormatter(requiredAmount, 2)} ({kFormatter((currentAmount / requiredAmount) * 100, 2)}%)
        </Typography>
      ) : null}
      {Object.values(cog?.stats)?.map(({ name, value }, index) =>
        name ? (
          <div key={`${name}-${index}`}>
            {notateNumber(value, 'Big')}
            {cleanUnderscore(name)}
          </div>
        ) : null
      )}
      index: {index}
    </>
  );
};

const SlotBackground = styled(Stack)`
  position: relative;
  background-image: url(${() => `${prefix}data/CogSq0.png`});
  background-repeat: no-repeat;
  background-position: center;

  width: 46px;
  height: 46px;

  &:before {
    content: "";
    display: block;
    position: absolute;
    z-index: -1;
    ${({ filled }) => (filled === 0 || filled === 100
            ? ''
            : `background: linear-gradient(to top, #9de060 ${filled}%, transparent 0%);`)}

    width: 44px;
    height: 41px;
    top: 1px;
    left: -1px;
  }
`;

const FlagIcon = styled.img`
  width: 43px;
  height: 42px;
`;

const SlotIcon = styled.img`
  width: 47px;
  height: 47px;
`;

const CardTitleAndValue = ({ cardSx, title, value, children }) => {
  return <Card sx={{ my: { xs: 0, md: 3 }, width: 'fit-content', ...cardSx }}>
    <CardContent>
      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>{title}</Typography>
      {value ? <Typography>{value}</Typography> : children}
    </CardContent>
  </Card>
}


export default Construction;
