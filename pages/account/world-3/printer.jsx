import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import React, { useContext, useMemo } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { growth, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Tooltip from '../../../components/Tooltip';
import { Breakdown, CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import { isGodEnabledBySorcerer } from '../../../parsers/lab';
import { NextSeo } from 'next-seo';
import { CLASSES, getCharacterByHighestTalent, getHighestMaxLevelTalentByClass } from '../../../parsers/talents';
import { getAtomColliderThreshold } from '../../../parsers/atomCollider';
import { calcTotals } from '../../../parsers/printer';

const Printer = () => {
  const { state } = useContext(AppContext);
  const { printer, lab } = state?.account;

  const wiredInBonus = lab?.labBonuses?.find((bonus) => bonus.name === 'Wired_In')?.active;
  const atomThreshold = getAtomColliderThreshold(state?.account?.accountOptions?.[133]);

  const totals = useMemo(() => calcTotals(state?.account), [state?.account]);
  const highestBrr = getCharacterByHighestTalent(state?.characters, CLASSES.Maestro, 'PRINTER_GO_BRRR');
  const highestMaxLevelBrr = getHighestMaxLevelTalentByClass(state?.characters, CLASSES.Maestro, 'PRINTER_GO_BRRR');

  return <>
    <NextSeo
      title="Printer | Idleon Toolbox"
      description="Keep track of your printer output with calculated bonuses from various sources"
    />
    <Typography variant={'caption'} component={'div'} mb={3}>* hover over items to see boosted values (totals section
      will also show atom per day)</Typography>

    <Stack direction={'row'} alignItems={'baseline'} gap={1}>
      <Typography variant={'h4'}>Totals</Typography>
      <Typography variant={'caption'}>* per hour</Typography>
    </Stack>
    <CardTitleAndValue title={'Atom threshold'} value={notateNumber(atomThreshold)}/>
    <Stack direction={'row'} gap={2} sx={{ mt: 2, mb: 5 }} flexWrap={'wrap'}>
      {Object.entries(totals || {})?.map(([item, { boostedValue, atomable, atoms }], index) => {
        const isAtom = item === 'atom'
        return <Card key={'total' + item + index}>
          <Tooltip
            title={<TotalTooltip atomable={atomable} item={item} value={boostedValue} atoms={atoms}
                                 highestMaxLevelBrr={highestMaxLevelBrr}
                                 highestBrr={highestBrr}
                                 atomThreshold={atomThreshold}/>}>
            <CardContent>
              <Stack alignItems={'center'} justifyContent={'center'} sx={{ width: 50, height: 50 }}>
                <Stack sx={{ width: 42, height: 42 }} justifyContent={'center'} alignItems={'center'} flexShrink={0}>
                  <ItemIcon atom={isAtom}
                            src={`${prefix}${isAtom ? 'etc/Particle' : `data/${item}`}.png`} alt="required-icon"/>
                </Stack>
                <Stack direction={'row'} alignItems={'center'} gap={1}>
                  {atoms ?
                    <img width={14} height={14} src={`${prefix}etc/Particle.png`} alt="particle-icon"/> : null}
                  <Typography>{isAtom
                    ? notateNumber(boostedValue, 'MultiplierInfo')
                    : notateNumber(boostedValue)}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Tooltip>
        </Card>
      })}
    </Stack>
    <Stack gap={3}>
      {printer?.map((printerSlots, index) => {
        const classIndex = state?.characters?.[index]?.classIndex;
        const playerName = state?.characters?.[index]?.name;
        const printerSample = Math.min(90, state?.characters?.[index]?.printerSample);
        const extraPrinterSample = state?.characters?.[index]?.printerSample - 90;
        const labBonusActive = (state?.characters?.[index]?.afkTarget === 'Laboratory' || isGodEnabledBySorcerer(state?.characters?.[index], 1) ||
          state?.account?.divinity?.linkedDeities?.[index] === 1) && wiredInBonus;
        return <Card sx={{ width: 'fit-content' }} key={`printer-row-${index}`}>
          <CardContent>
            <Stack direction="row" alignItems={'center'} gap={3}>
              <Stack sx={{ width: 175, textAlign: 'center', flexDirection: { xs: 'column', sm: 'row' } }}
                     alignItems={'center'} gap={2}>
                <Stack alignItems={'center'} justifyContent={'center'}>
                  <img className={'class-icon'} src={`${prefix}data/ClassIcons${classIndex}.png`} alt="class-icon"/>
                </Stack>
                <Stack>
                  <Typography className={'character-name'}>{playerName}</Typography>
                  <Typography variant={'caption'}>Printer Sample: {printerSample}%{extraPrinterSample > 0
                    ? ` (+${notateNumber(extraPrinterSample, 'MultiplierInfo')})` : ''}</Typography>
                </Stack>
              </Stack>
              <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} justifyContent={'center'} gap={3}>
                {printerSlots?.map((slot, slotIndex) => {
                  return <Tooltip key={`${slot?.name}-${slotIndex}`} title={<BoostedTooltip {...slot}/>}>
                    <Card sx={{ borderColor: slot?.active ? 'success.light' : '#424242', borderWidth: 1 }}
                          variant='outlined'>
                      <CardContent>
                        {slot?.item !== 'Blank' ?
                          <Stack sx={{ width: 50, height: 50 }} position={'relative'} justifyContent={'flex-start'}
                                 alignItems={'center'}>
                            <ItemIcon src={`${prefix}data/${slot?.item}.png`} alt="item-icon"/>
                            <Typography
                              color={slot?.active && labBonusActive
                                ? 'multiLight'
                                : ''}>{notateNumber(slot?.value, 'Big')}</Typography>
                          </Stack> :
                          <Stack sx={{ width: 50, height: 50 }} alignItems={'center'}
                                 justifyContent={'center'}><Typography
                            variant={'caption'}>EMPTY</Typography></Stack>}
                      </CardContent>
                    </Card>
                  </Tooltip>
                })}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>;
};

const BoostedTooltip = ({ value, boostedValue, breakdown }) => {
  return (
    (<Stack>
      <TitleAndValue boldTitle title={'Base value'} value={notateNumber(value, 'Big')}/>
      <TitleAndValue boldTitle title={'Boosted value'} value={notateNumber(boostedValue, 'Big')}/>
      {breakdown.length > 0 ? <Stack>
        <Divider flexItem sx={{ my: 1 }}/>
        <Breakdown breakdown={breakdown} notation={'MultiplierInfo'} />
      </Stack> : null}
    </Stack>)
  );
}

const TotalTooltip = ({ item, value, atoms, highestBrr, highestMaxLevelBrr }) => {
  const isAtom = item === 'atom';
  const perDay = value * 24;
  const maxPrinterGoBrrr = growth(highestMaxLevelBrr?.funcX, highestMaxLevelBrr?.maxLevel, highestMaxLevelBrr?.x1, highestMaxLevelBrr?.x2, false);
  const actualPrinterGoBrrr = highestBrr?.flatTalents?.find(({ name }) => name === 'PRINTER_GO_BRRR');
  let highestPrinterGoBrr = 0;
  if (actualPrinterGoBrrr?.level > 0) {
    highestPrinterGoBrr = growth(actualPrinterGoBrrr?.funcX, actualPrinterGoBrrr?.level, actualPrinterGoBrrr?.x1, actualPrinterGoBrrr?.x2, false)
  }
  return <Stack gap={1}>
    {item !== 'atom' ? <Stack direction={'row'} gap={1} alignItems={'center'}>
      <img width={30} height={30} src={`${prefix}data/${item}.png`} alt=""/>
      <Typography>{notateNumber(perDay)} / day</Typography>
    </Stack> : null}
    {maxPrinterGoBrrr > 0 && !highestPrinterGoBrr ? <Stack sx={{ ml: .5 }} direction={'row'} gap={2}
                                                           alignItems={'center'}>
      <img width={24} height={24} src={`${prefix}data/UISkillIcon32.png`} alt=""/>
      <Typography>{notateNumber(value * maxPrinterGoBrrr)} / printer go brr ({maxPrinterGoBrrr} hours)</Typography>
    </Stack> : null}
    {highestPrinterGoBrr > 0 ? <Stack sx={{ ml: .5 }} direction={'row'} gap={2} alignItems={'center'}>
      <img width={24} height={24} src={`${prefix}data/UISkillIcon32.png`} alt=""/>
      <Typography>{notateNumber(value * highestPrinterGoBrr)} / printer go brr
        ({highestPrinterGoBrr} hours)</Typography>
    </Stack> : null}
    {(atoms || isAtom) ?
      <Stack sx={{ ml: .5 }} direction={'row'} gap={2} alignItems={'center'}>
        <img width={24} height={24} src={`${prefix}etc/Particle.png`} alt=""/>
        <Typography>{notateNumber(atoms * 24)} / day </Typography>
      </Stack> : null}
  </Stack>
}

const ItemIcon = styled.img`
  width: ${({ atom }) => atom ? 24 : 42}px;
  height: ${({ atom }) => atom ? 24 : 42}px;
`

export default Printer;
