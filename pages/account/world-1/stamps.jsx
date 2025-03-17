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
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, getCoinsArray, notateNumber, prefix } from '@utility/helpers';
import styled from '@emotion/styled';
import CoinDisplay from 'components/common/CoinDisplay';
import Tooltip from 'components/Tooltip';
import { NextSeo } from 'next-seo';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { CardTitleAndValue } from '@components/common/styles';
import { calcStampLevels, evaluateStamp, getStampBonus, unobtainableStamps, updateStamps } from '@parsers/stamps';
import Grid from '@mui/material/Grid2';
import { grey } from '@mui/material/colors';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import Link from '@mui/material/Link';
import { useRouter } from 'next/router';
import MenuItem from '@mui/material/MenuItem';
import { useLocalStorage } from '@mantine/hooks';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const reducerValues = [
  0,
  30,
  60,
  90
];

const Stamps = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
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
  const stampReducer = state?.account?.atoms?.stampReducer;
  const localStamps = useMemo(() => updateStamps(state?.account, state?.characters, forcedGildedStamp, forcedStampReducer, forceMaxCapacity), [forcedGildedStamp,
    forcedStampReducer, forceMaxCapacity, state]);

  const getBorder = (stamp) => {
    const { materials, level, hasMoney, hasMaterials, greenStackHasMaterials, enoughPlayerStorage } = stamp;
    if (level <= 0) return '';
    if (!hasMoney) {
      return 'warning.light';
    } else if (!enoughPlayerStorage) {
      return '#e3e310'
    } else if (!hasMaterials || (subtractGreenStacks && !greenStackHasMaterials)) {
      return 'error.light';
    } else if (materials.length > 0) {
      return ''
    } else if (materials.length === 0 && (hasMaterials) && hasMoney && enoughPlayerStorage) {
      const index = reducerValues.indexOf(forcedStampReducer);
      const minReductionStamp = evaluateStamp(stamp, state?.account, state?.characters, gildedStamps, reducerValues[index - 1], forceMaxCapacity);
      if (forcedStampReducer !== 0 && minReductionStamp?.materials.length === 0 && (minReductionStamp?.hasMaterials) && minReductionStamp?.hasMoney && minReductionStamp?.enoughPlayerStorage) {
        return 'secondary.dark';
      }
      return 'info.light';
    }
  }

  return (
    (<div>
      <NextSeo
        title="Stamps | Idleon Toolbox"
        description="Keep track of your stamps levels and requirements"
      />
      <Stack mt={1} direction={'row'} gap={3} justifyContent={'center'} flexWrap={'wrap'}>
        <CardTitleAndValue title={'Legend'} stackProps={{ gap: .7 }}>
          <Color color={'warning.light'} desc={'Missing Money'}/>
          <Color color={'error.light'} desc={'Missing Materials'}/>
          <Color color={'#e3e310'} desc={'Not Enough Player Storage'}/>
          <Color color={'grey'} desc={'Equipments'}/>
          <Color color={'secondary.dark'} desc={'Upgradeable at prev. reduction'}/>
          <Color color={'info.light'} desc={'Upgradeable'}/>
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
              <MenuItem value={0}>0</MenuItem>
              <MenuItem value={30}>30</MenuItem>
              <MenuItem value={60}>60</MenuItem>
              <MenuItem value={90}>90</MenuItem>
            </Select>
          </FormControl>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Options'}>
          <Stack>
            <Link underline={'hover'}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => router.push({ pathname: 'old-stamps' })}>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <ArrowRightAltIcon/>
                <Typography>Old Stamps Page</Typography>
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
                <Typography sx={{ flexBasis: '100%' }}
                            variable={'subtitle2'}>{category.capitalize()}</Typography>
                {stamps.map((stamp, stampIndex) => {
                  const {
                    rawName,
                    level,
                    materials,
                    hasMaterials,
                    greenStackHasMaterials,
                    hasMoney,
                    enoughPlayerStorage,
                    reqItemMultiplicationLevel,
                    displayName,
                    bestCharacter
                  } = stamp;
                  const bonus = getStampBonus(state?.account, category, rawName, bestCharacter);
                  const border = getBorder(stamp);
                  const isBlank = displayName === 'Blank';
                  return (
                    <Grid
                      key={rawName + stampIndex}
                      size={{ xs: 4, sm: 3 }}>
                      <Tooltip maxWidth={450}
                               title={isBlank ? '' : <StampInfo {...stamp} bonus={bonus}
                                                                subtractGreenStacks={subtractGreenStacks}/>}>
                        <Card sx={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 50,
                          border: materials.length === 0 && (subtractGreenStacks
                            ? greenStackHasMaterials
                            : hasMaterials) && hasMoney && (enoughPlayerStorage && ((level + 1) % reqItemMultiplicationLevel !== 0)) && level > 0
                            ? '1px solid'
                            : '',
                          borderColor: border
                        }}
                              variant={'outlined'}
                              onClick={() => window.open(`https://idleon.wiki/wiki/${displayName}`, '_blank')}
                        >
                          <CardContent sx={{ '&:last-child': { p: 0 } }}>
                            <Stack direction={'row'} alignItems={'center'} justifyContent={'space-around'}>
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
                     bonus
                   }) => {
  const storageColor = enoughPlayerStorage ? '' : '#e57373';
  const materialColor = hasMaterials ? '' : '#e57373';
  return <Box sx={{ p: 1 }}>
    <Typography variant={'h6'}>{cleanUnderscore(displayName)} (Lv {level})</Typography>
    <Typography sx={{ color: level > 0 && multiplier > 1 ? 'info.dark' : '' }}
                variant={'body1'}>+{cleanUnderscore(effect.replace(/\+{/, notateNumber(bonus, 'MultiplierInfo').replace('.00', '')))}</Typography>
    {unobtainableStamps[displayName] ? <Typography mt={1}>(Unobtainable)</Typography> : null}
    {level > 0 ? <>
      <CostSection isMaterialCost={!(hasMoney && hasMaterials && enoughPlayerStorage)}
                   hasMoney={hasMoney}
                   hasMaterials={hasMaterials}
                   enoughPlayerStorage={enoughPlayerStorage}
                   rawName={itemReq.rawName}
                   materialCost={materialCost}
                   goldCost={goldCost}
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
        <div>
          <Typography mt={2} variant={'subtitle2'} gutterBottom>Storage Amount</Typography>
          <Typography color={materialColor} variant={'body2'}>{notateNumber((subtractGreenStacks
            ? greenStackOwnedMats
            : ownedMats) || 0, 'Big')}</Typography>
        </div>
      </Stack>
    </> : null}
  </Box>;
}

const CostSection = ({
                       showBoth,
                       isMaterialCost,
                       reduction,
                       rawName,
                       materialCost,
                       goldCost,
                       level,
                       hasMoney
                     }) => {
  const moneyColor = showBoth ? '' : hasMoney ? '' : '#e57373';
  return <Stack direction={'row'} gap={3} alignItems={'center'} justifyContent={'space-between'}>
    {isMaterialCost || showBoth ? <Stack my={1} direction={'row'} alignItems={'center'} gap={1}>
      <Typography variant={'subtitle2'}>{level}</Typography>
      <ItemIcon src={`${prefix}data/${rawName}.png`}
                alt=""/>
      <Typography variant={'subtitle2'}>{materialCost
        ? notateNumber(materialCost, 'Big')
        : null}</Typography>
    </Stack> : null}
    {!isMaterialCost || showBoth ? <CoinDisplay style={{ color: moneyColor }}
                                                variant={'horizontal'}
                                                title={''} maxCoins={3}
                                                money={getCoinsArray(goldCost)}/> : null}
    {(isMaterialCost || showBoth) && reduction >= 0
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

const Color = ({ color, desc }) => {
  return <Stack direction={'row'} gap={1} alignItems={'center'}>
    <Avatar sx={{ bgcolor: color, width: 24, height: 24 }} alt={color} src={''}>&nbsp;</Avatar>
    <Typography variant={'body2'}>{desc}</Typography>
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
