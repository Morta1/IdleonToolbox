import {
  Avatar,
  Box,
  Card,
  CardContent,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Select,
  Stack,
  Switch,
  Typography
} from '@mui/material';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, getCoinsArray, notateNumber, prefix } from '@utility/helpers';
import styled from '@emotion/styled';
import CoinDisplay from 'components/common/CoinDisplay';
import Tooltip from 'components/Tooltip';
import { NextSeo } from 'next-seo';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { Breakdown, CardTitleAndValue } from '@components/common/styles';
import {
  calcStampLevels,
  evaluateStamp,
  getStampBonus,
  getStampsPerDay,
  unobtainableStamps,
  updateStamps
} from '@parsers/stamps';
import Grid from '@mui/material/Grid2';
import { grey } from '@mui/material/colors';
import Link from '@mui/material/Link';
import { useRouter } from 'next/router';
import MenuItem from '@mui/material/MenuItem';
import { useLocalStorage } from '@mantine/hooks';
import { IconChevronRight, IconDeviceFloppy, IconInfoCircleFilled } from '@tabler/icons-react';
import Button from '@mui/material/Button';
import { format, isValid } from 'date-fns';
import useCheckbox from '@components/common/useCheckbox';

const Stamps = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const [levelsSnapshot, setLevelsSnapshot] = useLocalStorage({
    key: 'stamps:levels',
    defaultValue: { snapshotTime: null, levels: {} }
  });
  const [reducerValues, setReducerValues] = useState([0]);
  const [types, setTypes] = useLocalStorage({
    key: 'stamps:types',
    defaultValue: {
      level: true,
      money: true,
      materials: true,
      player: true,
      equipments: true,
      reduction: true,
      upgradable: true
    }
  });
  const stampsPerDay = getStampsPerDay(state?.account);

  useEffect(() => {
    const hydrogenAtom = state?.account?.atoms?.atoms?.[0];
    const valuePerDay = hydrogenAtom?.baseBonus * hydrogenAtom?.level;
    if (!valuePerDay || valuePerDay <= 0) return;

    const values = [];
    let val = 0;

    for (let i = 0; i < 6 && val <= 90; i++) {
      values.push(val);
      val += Math.max(20, valuePerDay);
    }

    if (values[values.length - 1] !== 90 && values.length < 6) {
      values.push(90);
    }

    setReducerValues(values);
  }, [state?.account]);


  const noSelectedTypes = Object.values(types).every((b) => !b);
  const gildedStamps = isRiftBonusUnlocked(state?.account?.rift, 'Stamp_Mastery')
    ? state?.account?.accountOptions?.[154]
    : 0;
  const [forcedGildedStamp, setForcedGildedStamp] = useState(gildedStamps > 0);
  const [forcedStampReducer, setForcedStampReducer] = useState(state?.account?.atoms?.stampReducer);
  const [forceMaxCapacity, setForceMaxCapacity] = useLocalStorage({
    key: 'stamps:forceMaxCapacity',
    defaultValue: false
  });
  const [subtractGreenStacks, setSubtractGreenStacks] = useLocalStorage({
    key: 'stamps:subtractGreenStacks',
    defaultValue: false
  });
  const [SnapshotCheckboxEl, showSnapshotLevels] = useCheckbox('Show level-up indicator', true);
  const stampReducer = state?.account?.atoms?.stampReducer;
  const localStamps = useMemo(() => updateStamps(state?.account, state?.characters, forcedGildedStamp, forcedStampReducer, forceMaxCapacity), [forcedGildedStamp,
    forcedStampReducer, forceMaxCapacity, state]);

  const getStampTypeAndBorder = (stamp, mode) => {
    const { materials, level, hasMoney, hasMaterials, greenStackHasMaterials, enoughPlayerStorage } = stamp;
    if (level <= 0) return { border: '#1d1c1c', type: 'level' };
    if (!hasMoney && mode === 'money') {
      return { border: 'warning.light', type: 'money' };
    }
    else if (!enoughPlayerStorage && mode === 'material') {
      return { border: '#e3e310', type: 'player' }
    }
    else if (mode === 'material' && (!hasMaterials || (subtractGreenStacks && !greenStackHasMaterials))) {
      return { border: 'error.light', type: 'materials' };
    }
    else if (materials.length > 0) {
      return { border: 'grey', type: 'equipments' };
    }
    else if (materials.length === 0 && ((hasMaterials && enoughPlayerStorage) || mode === 'money') && hasMoney) {
      const index = reducerValues.indexOf(forcedStampReducer);
      const minReductionStamp = evaluateStamp(stamp, state?.account, state?.characters, gildedStamps, reducerValues[index - 1], forceMaxCapacity);
      if (forcedStampReducer !== 0 && minReductionStamp?.materials.length === 0 && ((minReductionStamp?.hasMaterials && minReductionStamp?.enoughPlayerStorage) || mode === 'money') && minReductionStamp?.hasMoney) {
        return { border: 'secondary.dark', type: 'reduction' };
      }
      return { border: 'info.light', type: 'upgradable' };
    }
  }

  const handleSwitchChange = (e, name) => {
    setTypes({ ...types, [name]: e.target.checked });
  }

  const handleSnapshot = () => {
    const levels = Object.entries(state?.account?.stamps)?.reduce((result, [key, values]) => {
      return {
        ...result,
        [key]: values.map(({ level }) => level)
      }
    }, {})
    setLevelsSnapshot({ levels, snapshotTime: new Date().getTime() });
  }

  return (
    (<div>
      <NextSeo
        title="Stamps | Idleon Toolbox"
        description="Keep track of your stamps levels and requirements"
      />
      <Stack mt={1} direction={'row'} gap={3} justifyContent={'center'} flexWrap={'wrap'}>
        <CardTitleAndValue title={'Legend'} stackProps={{ gap: .7 }}>
          <Color onChange={handleSwitchChange} name={'level'} value={types.level} color={'#1d1c1c'}
                 desc={'Level 0'}/>
          <Color onChange={handleSwitchChange} name={'money'} value={types.money} color={'warning.light'}
                 desc={'Missing Money'}/>
          <Color onChange={handleSwitchChange} name={'materials'} value={types.materials} color={'error.light'}
                 desc={'Missing Materials'}/>
          <Color onChange={handleSwitchChange} name={'player'} value={types.player} color={'#e3e310'}
                 desc={'Not Enough Player Storage'}/>
          <Color onChange={handleSwitchChange} name={'equipments'} value={types.equipments} color={'grey'}
                 desc={'Equipments'}/>
          <Color onChange={handleSwitchChange} name={'reduction'} value={types.reduction} color={'secondary.dark'}
                 desc={'Upgradeable at prev. reduction'}/>
          <Color onChange={handleSwitchChange} name={'upgradable'} value={types.upgradable} color={'info.light'}
                 desc={'Upgradeable'}/>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Gilded Stamp'}>
          <Stack alignItems={'center'} direction={'row'} gap={2}>
            <img src={`${prefix}data/GildedStamp.png`} alt=""/>
            <Stack>
              <Typography>Owned: {gildedStamps}</Typography>
              <Typography>Chance: {calcStampLevels(state?.account?.stamps) / 100}%</Typography>
            </Stack>
          </Stack>
          <FormControlLabel
            control={<Switch checked={forcedGildedStamp} onChange={() => setForcedGildedStamp(!forcedGildedStamp)}/>}
            label="Gilded Stamp"/>
          <Divider sx={{ my: 1 }}/>
          <Typography sx={{ fontSize: 14 }} color="text.secondary">No Stamp Left Behind</Typography>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <Typography>{stampsPerDay?.value}</Typography>
            <Tooltip
              title={<Breakdown breakdown={stampsPerDay?.breakdown} />}>
              <IconInfoCircleFilled size={18}/>
            </Tooltip>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Stamp Reducer'}>
          <Stack alignItems={'center'} direction={'row'} gap={2}>
            <img src={`${prefix}data/Atom0.png`} height={36} alt=""/>
            {stampReducer ?? 0}%
          </Stack>
          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel id={'custom-reducer'}>Custom Reduction</InputLabel>
            <Select
              sx={{ minWidth: 150 }}
              size="small"
              label={'Custom Reduction'}
              labelId={'custom-reducer'}
              defaultValue={stampReducer}
              value={forcedStampReducer}
              onChange={(e) => setForcedStampReducer(e.target.value)}
            >
              {reducerValues?.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
            </Select>
          </FormControl>
          <Divider sx={{ my: 2 }}/>
          <Typography sx={{ fontSize: 14, mb: 1 }} variant={'body1'} color={'text.secondary'}>Exalted
            Stamps</Typography>
          <Stack direction={'row'} alignItems={'center'} gap={2}>
            <img src={`${prefix}etc/Exalted_Stamp_Frame.png`} style={{ width: 32, height: 32 }}/>
            <Typography>{state?.account?.compass?.remainingExaltedStamps} / {state?.account?.compass?.usedExaltedStamps + state?.account?.compass?.remainingExaltedStamps}</Typography>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Options'}>
          <Stack gap={1}>
            <Link underline={'hover'}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => router.push({ pathname: 'old-stamps' })}>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <IconChevronRight size={16}/>
                <Typography>Old Page</Typography>
              </Stack>
            </Link>
            <FormControlLabel
              control={<Checkbox name={'mini'}
                                 checked={subtractGreenStacks}
                                 onChange={() => setSubtractGreenStacks(!subtractGreenStacks)}
                                 size={'small'}/>}
              label={'Subtract Green Stacks'}/>
            <Stack direction={'row'} alignItems={'center'}>
              <FormControlLabel
                control={<Checkbox name={'Force max capacity'}
                                   checked={forceMaxCapacity}
                                   onChange={() => setForceMaxCapacity(!forceMaxCapacity)}
                                   size={'small'}/>}
                label={'Force max capacity'}/>
              <MaxCapacityTooltip/>
            </Stack>
            <Stack direction={'row'} alignItems={'center'}>
              <SnapshotCheckboxEl/>
              <Tooltip
                title={'After taking a snapshot, an indicator will appear on any stamp that has leveled up, whether manually or via the No Stamp Left Behind mechanic.'}>
                <IconInfoCircleFilled size={18}/>
              </Tooltip>
            </Stack>
            <Button sx={{ width: 'fit-content' }} variant={'contained'} size={'small'}
                    onClick={handleSnapshot}
                    startIcon={<IconDeviceFloppy/>}>
              Save levels snapshot
            </Button>
            {isValid(levelsSnapshot?.snapshotTime) ? <Typography variant={'caption'}>Snapshotted
              at: {format(levelsSnapshot?.snapshotTime, 'dd/MM/yyyy HH:MM')}</Typography> : null}
          </Stack>
        </CardTitleAndValue>
      </Stack>
      <Container>
        <Grid container sx={{ justifyContent: 'center' }} spacing={2}>
          {Object.entries(localStamps || {}).map(([category, stamps], categoryIndex) => {
            return (
              <Grid
                container
                spacing={.5}
                columns={12}
                sx={{ alignContent: 'start', justifyContent: 'center' }}
                key={category + '' + categoryIndex}
                size={{
                  xs: 12,
                  md: 6,
                  lg: 4
                }}>
                <Typography variant={'body1'} sx={{ flexBasis: '100%' }}
                            variable={'subtitle2'}>{category.capitalize()}</Typography>
                {noSelectedTypes ? <Typography variant={'body2'} sx={{ flexBasis: '100%' }} variable={'subtitle2'}>Select
                  at least one
                  type</Typography> : null}
                {stamps.map((stamp, stampIndex) => {
                  const {
                    rawName,
                    level,
                    materials,
                    hasMaterials,
                    greenStackHasMaterials,
                    hasMoney,
                    enoughPlayerStorage,
                    displayName,
                    bestCharacter,
                    maxLevel
                  } = stamp;
                  const bonus = getStampBonus(state?.account, category, rawName, bestCharacter);
                  const mode = level < maxLevel ? 'money' : 'material';
                  const { border, type } = getStampTypeAndBorder(stamp, mode) || {};
                  const isBlank = displayName === 'Blank';
                  if (types.hasOwnProperty(type) && !types[type]) return;
                  let snapshotDiff;
                  if (level > levelsSnapshot?.levels?.[category]?.[stampIndex]) {
                    snapshotDiff = level - levelsSnapshot?.levels?.[category]?.[stampIndex];
                  }
                  const noMaterials = materials.length === 0;
                  const isMoneyMode = mode === 'money';
                  const hasValidLevel = level > 0;

                  const hasValidMaterials = subtractGreenStacks
                    ? (greenStackHasMaterials || isMoneyMode)
                    : (hasMaterials || isMoneyMode);

                  const hasEnoughStorage = enoughPlayerStorage || isMoneyMode;
                  return (
                    <Grid
                      key={rawName + stampIndex}
                      size={{ xs: 4, sm: 3 }}>
                      <Tooltip maxWidth={450}
                               title={isBlank ? '' : <StampInfo {...stamp} bonus={bonus}
                                                                subtractGreenStacks={subtractGreenStacks}/>}>
                        <Card sx={{
                          position: 'relative',
                          overflow: 'visible',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 50,
                          border: noMaterials && hasValidMaterials && hasMoney && hasEnoughStorage && hasValidLevel
                            ? '1px solid'
                            : '',
                          borderColor: border
                        }}
                              variant={'outlined'}
                              onClick={() => window.open(`https://idleon.wiki/wiki/${displayName}`, '_blank')}
                        >
                          {snapshotDiff > 0 && showSnapshotLevels ? <img style={{
                            position: 'absolute',
                            right: -5,
                            top: -5
                          }} src={`${prefix}data/UpgArrowG.png`} alt={'level-up indicator'}/> : null}
                          <CardContent sx={{ '&:last-child': { p: 0 } }}>

                            <Stack direction={'row'} alignItems={'center'} justifyContent={'space-around'}
                                   sx={{ position: 'relative' }}>
                              {state?.account?.compass?.exaltedStamps?.[category]?.[stampIndex] ? <img
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  width: 40,
                                  height: 40
                                }}
                                src={`${prefix}etc/Exalted_Stamp_Frame.png`}/> : null}
                              <StampIcon width={40} height={40}
                                         level={level}
                                         src={`${prefix}data/${rawName}.png`}
                                         alt=""/>
                              <Typography>{level}</Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Tooltip>
                    </Grid>
                  );
                })}
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </div>)
  );
};

const StampInfo = ({
                     displayName,
                     level,
                     effect,
                     multiplier,
                     goldCost,
                     materialCost,
                     futureCosts,
                     bestCharacter,
                     subtractGreenStacks,
                     ownedMats,
                     greenStackOwnedMats,
                     hasMoney,
                     hasMaterials,
                     enoughPlayerStorage,
                     itemReq,
                     bonus,
                     maxLevel
                   }) => {
  const storageColor = enoughPlayerStorage ? '' : '#e57373';
  const materialColor = hasMaterials ? '' : '#e57373';
  const mode = level < maxLevel ? 'money' : 'material';
  return <Box sx={{ p: 1 }}>
    <Typography variant={'h6'}>{cleanUnderscore(displayName)} (Lv {level})</Typography>
    <Typography sx={{ color: level > 0 && multiplier > 1 ? 'info.dark' : '' }}
                variant={'body1'}>+{cleanUnderscore(effect.replace(/\+{/, notateNumber(bonus, 'MultiplierInfo').replace('.00', '')))}</Typography>
    {unobtainableStamps[displayName] ? <Typography mt={1}>(Unobtainable)</Typography> : null}
    {level > 0 ? <>
      <CostSection hasMoney={hasMoney}
                   hasMaterials={hasMaterials}
                   enoughPlayerStorage={enoughPlayerStorage}
                   rawName={itemReq.rawName}
                   materialCost={materialCost}
                   goldCost={goldCost}
                   mode={mode}
                   level={level}/>
      <Divider variant={'middle'} sx={{ bgcolor: grey[600], my: 1 }}/>
      {futureCosts?.map((futureCost, index) => {
        return <CostSection key={'future-' + index}
                            showBoth={true}
                            {...futureCost}
        />
      })}
      <Stack direction={'row'} gap={2}>
        <div>
          <Typography mt={2} variant={'subtitle2'} gutterBottom>Max capacity</Typography>
          <Typography
            color={storageColor}
            variant={'body2'}>{bestCharacter?.character} ({notateNumber(bestCharacter?.maxCapacity ?? 0, 'Big')})</Typography>
        </div>
        {mode === 'material' ? <div>
          <Typography mt={2} variant={'subtitle2'} gutterBottom>Storage Amount</Typography>
          <Typography color={materialColor} variant={'body2'}>{notateNumber((subtractGreenStacks
            ? greenStackOwnedMats
            : ownedMats) || 0, 'Big')}</Typography>
        </div> : null}
      </Stack>
    </> : null}
  </Box>;
}

const CostSection = ({
                       showBoth,
                       reduction,
                       rawName,
                       materialCost,
                       goldCost,
                       level,
                       hasMoney,
                       mode
                     }) => {
  const moneyColor = showBoth ? '' : hasMoney ? '' : '#e57373';
  return <Stack direction={'row'} gap={3} alignItems={'center'}
                mt={1}
                justifyContent={showBoth ? 'space-between' : 'flex-start'}>
    <Typography variant={'subtitle2'}>{level}</Typography>
    {mode === 'material' || showBoth ? <Stack my={1} direction={'row'} alignItems={'center'} gap={1}>
      <ItemIcon src={`${prefix}data/${rawName}.png`}
                alt=""/>
      <Typography variant={'subtitle2'}>{materialCost
        ? notateNumber(materialCost, 'Big')
        : null}</Typography>
    </Stack> : null}
    {mode === 'money' || showBoth ? <CoinDisplay style={{ color: moneyColor }}
                                                 variant={'horizontal'}
                                                 title={''} maxCoins={3}
                                                 money={getCoinsArray(goldCost)}/> : null}
    {showBoth && reduction >= 0
      ? <Typography variant={'subtitle2'}>{reduction}%</Typography>
      : null}
  </Stack>
}

const StampIcon = styled.img`
  opacity: ${({ level }) => level === 0 ? .5 : 1};
`;

const ItemIcon = styled.img`
  width: 32px;
  height: 32px;
  opacity: ${({ hide }) => hide ? 0.5 : 1};
`;

const Color = ({ color, desc, value, onChange, name }) => {
  return <Stack direction={'row'} gap={1} alignItems={'center'} justifyContent={'space-between'}>
    <Stack direction={'row'} gap={1} alignItems={'center'}>
      <Avatar sx={{ bgcolor: color, width: 24, height: 24 }} alt={color} src={''}>&nbsp;</Avatar>
      <Typography variant={'body2'}>{desc}</Typography>
    </Stack>
    <Switch size={'small'} checked={value} onChange={(e) => onChange(e, name)}/>
  </Stack>
}

const CustomListItem = ({ children }) => {
  return <ListItem disablePadding><ListItemText
    slotProps={{ primary: { variant: 'caption' } }}>{children}</ListItemText></ListItem>
}

const MaxCapacityTooltip = () => {
  return <Tooltip title={<Stack sx={{ p: .5 }}>
    <Typography variant={'h6'}>Forcing the following:</Typography>
    <List>
      <CustomListItem>- Without Zerg Rushogen prayer</CustomListItem>
      <CustomListItem>- With the Ruck Sack prayer</CustomListItem>
      <CustomListItem>- With VMan Talent (for vman)</CustomListItem>
      <CustomListItem>- With the three carry cap star signs (as active)</CustomListItem>
      <CustomListItem>- With Nanochip (if you have it somewhere)</CustomListItem>
    </List>
  </Stack>}>
    <IconInfoCircleFilled size={18}/>
  </Tooltip>
}

export default Stamps;
