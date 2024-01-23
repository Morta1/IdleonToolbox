import { Avatar, Card, CardContent, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, getCoinsArray, growth, notateNumber, prefix } from '@utility/helpers';
import styled from '@emotion/styled';
import CoinDisplay from 'components/common/CoinDisplay';
import Tooltip from 'components/Tooltip'; // Grid version 2
import { NextSeo } from 'next-seo';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { CardTitleAndValue } from '@components/common/styles';
import { calcStampLevels } from '@parsers/stamps';
import Grid from '@mui/material/Unstable_Grid2';
import { grey } from '@mui/material/colors';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import Link from '@mui/material/Link';
import { useRouter } from 'next/router';

const Stamps = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const gildedStamps = isRiftBonusUnlocked(state?.account?.rift, 'Stamp_Mastery')
    ? state?.account?.accountOptions?.[154]
    : 0;
  const stampReducer = state?.account?.atoms?.stampReducer;
  const [subtractGreenStacks, setSubtractGreenStacks] = React.useState(false);

  const getBorder = ({ materials, level, hasMoney, hasMaterials, greenStackHasMaterials, enoughPlayerStorage }) => {
    if (level <= 0) return '';
    if (!hasMoney) {
      return 'warning.light';
    }
    else if (!hasMaterials || (subtractGreenStacks && !greenStackHasMaterials)) {
      return 'error.light';
    }
    else if (!enoughPlayerStorage) {
      return '#e3e310'
    }
    else if (materials.length > 0) {
      return ''
    }
    return materials.length === 0 && (hasMaterials) && hasMoney && enoughPlayerStorage
      ? 'info.light'
      : '';
  }

  return (
    <div>
      <NextSeo
        title="Stamps | Idleon Toolbox"
        description="Keep track of your stamps levels and requirements"
      />
      <Typography textAlign={'center'} variant={'h4'} mb={3}>Stamps</Typography>
      <Typography textAlign={'center'} component={'div'} variant={'caption'} mb={1}>* Blue border means you have enough
        material, money and space to
        craft</Typography>
      <Stack direction={'row'} justifyContent={'center'} gap={1}>
        <Tooltip title={'Missing Money'}>
          <Avatar sx={{ bgcolor: 'warning.light', width: 24, height: 24 }} alt={'m'}
                  src={''}>&nbsp;</Avatar>
        </Tooltip>
        <Tooltip title={'Missing Materials'}>
          <Avatar sx={{ bgcolor: 'error.light', width: 24, height: 24 }} alt={'m'}
                  src={''}>&nbsp;</Avatar>
        </Tooltip>
        <Tooltip title={'Not Enough Player Storage'}>
          <Avatar sx={{ bgcolor: '#e3e310', width: 24, height: 24 }}
                  alt={'m'}
                  src={''}>&nbsp;</Avatar>
        </Tooltip>
        <Tooltip title={'Equipments'}>
          <Avatar sx={{ bgcolor: 'grey', width: 24, height: 24 }}
                  alt={'m'}
                  src={''}>&nbsp;</Avatar>
        </Tooltip>
        <Tooltip title={'Upgradeable'}>
          <Avatar sx={{ bgcolor: 'info.light', width: 24, height: 24 }}
                  alt={'m'}
                  src={''}>&nbsp;</Avatar>
        </Tooltip>
      </Stack>
      <Stack mt={1} direction={'row'} gap={3} justifyContent={'center'} flexWrap={'wrap'}>
        <CardTitleAndValue title={'Gilded stamp'}>
          <Stack alignItems={'center'} direction={'row'} gap={2}>
            <img src={`${prefix}data/GildedStamp.png`} alt=""/>
            <Stack>
              <Typography>Owned: {gildedStamps}</Typography>
              <Typography>Chance: {calcStampLevels(state?.account?.stamps) / 100}%</Typography>
            </Stack>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Stamp Reducer'}>
          <Stack alignItems={'center'} direction={'row'} gap={2}>
            <img src={`${prefix}data/Atom0.png`} height={36} alt=""/>
            {stampReducer ?? 0}%
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Options'}>
          <Stack>
            <FormControlLabel
              control={<Checkbox name={'mini'}
                                 checked={subtractGreenStacks}
                                 onChange={() => setSubtractGreenStacks(!subtractGreenStacks)}
                                 size={'small'}/>}
              label={'Subtract Green Stacks'}/>
            <Link underline={'hover'}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => router.push({ pathname: 'old-stamps' })}>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <ArrowRightAltIcon/>
                <Typography>Old Stamps Page</Typography>
              </Stack>
            </Link>
          </Stack>
        </CardTitleAndValue>
      </Stack>
      <Grid container sx={{ justifyContent: 'center' }} spacing={2}>
        {Object.entries(state?.account?.stamps).map(([category, stamps], categoryIndex) => {
          return <Grid xs={12} md={6} lg={4} container spacing={.5}
                       sx={{ alignContent: 'start', justifyContent: 'center' }}
                       key={category + '' + categoryIndex}>
            <Typography sx={{ flexBasis: '100%' }} variable={'subtitle2'}>{category.capitalize()}</Typography>
            {stamps.map((stamp, stampIndex) => {
              const {
                rawName,
                level,
                materials,
                hasMaterials,
                greenStackHasMaterials,
                hasMoney,
                enoughPlayerStorage,
                reqItemMultiplicationLevel
              } = stamp;
              const border = getBorder(stamp);
              return <Grid xs={4} sm={3} key={rawName + stampIndex}>
                <Tooltip maxWidth={450} dark title={<StampInfo {...stamp} subtractGreenStacks={subtractGreenStacks}/>}>
                  <Card sx={{
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
                  }} variant={'outlined'}>
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
            })}
          </Grid>
        })}
      </Grid>
    </div>
  );
};

const StampInfo = ({
                     func,
                     x1,
                     x2,
                     displayName,
                     level,
                     effect,
                     multiplier,
                     goldCost,
                     rawName,
                     materialCost,
                     futureCosts,
                     bestCharacter,
                     subtractGreenStacks,
                     ownedMats,
                     greenStackOwnedMats,
                     hasMoney,
                     hasMaterials,
                     enoughPlayerStorage,
                     reqItemMultiplicationLevel
                   }) => {
  const bonus = growth(func, level, x1, x2, true) * (multiplier ?? 1);
  const storageColor = enoughPlayerStorage ? 'white' : '#e57373';
  const materialColor = hasMaterials ? 'white' : '#e57373';
  return <>
    <Typography variant={'h5'}>{cleanUnderscore(displayName)} (Lv {level})</Typography>
    <Typography sx={{ color: level > 0 && multiplier > 1 ? 'info.light' : '' }}
                variant={'body1'}>+{cleanUnderscore(effect.replace(/\+{/, bonus))}</Typography>
    {level > 0 ? <>
      <CostSection isMaterialCost={false}
                   hasMoney={hasMoney}
                   hasMaterials={hasMaterials}
                   enoughPlayerStorage={enoughPlayerStorage}
                   rawName={rawName}
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
  </>
}

const CostSection = ({
                       showBoth,
                       isMaterialCost,
                       reduction,
                       rawName,
                       materialCost,
                       goldCost,
                       level,
                       hasMoney,
                       hasMaterials,
                     }) => {
  const moneyColor = showBoth ? 'white' : hasMoney ? 'white' : '#e57373';
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
    {isMaterialCost || showBoth ? <Typography variant={'subtitle2'}>{reduction}%</Typography> : null}
  </Stack>
}

const BonusIcon = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
`

const StampIcon = styled.img`
  opacity: ${({ level }) => level === 0 ? .5 : 1};
`;

const ItemIcon = styled.img`
  width: 32px;
  height: 32px;
  opacity: ${({ hide }) => hide ? 0.5 : 1};
`;

export default Stamps;
