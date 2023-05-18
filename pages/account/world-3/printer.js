import { Card, CardContent, Stack, Typography } from "@mui/material";
import React, { useContext, useMemo } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { growth, notateNumber, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import Tooltip from "../../../components/Tooltip";
import { TitleAndValue } from "../../../components/common/styles";
import { isGodEnabledBySorcerer } from "../../../parsers/lab";
import { NextSeo } from "next-seo";
import { getHighestMaxLevelTalentByClass } from "../../../parsers/talents";
import { getAtomColliderThreshold } from "../../../parsers/atomCollider";
import { calculateItemTotalAmount } from "../../../parsers/items";

const Printer = () => {
  const { state } = useContext(AppContext);
  const { printer, lab } = state?.account;

  const wiredInBonus = lab?.labBonuses?.find((bonus) => bonus.name === 'Wired_In')?.active;
  const atomThreshold = getAtomColliderThreshold(state?.account?.accountOptions?.[133]);

  const calcTotals = (printer) => {
    const totals = printer?.reduce((res, character) => {
      character.forEach(({ boostedValue, item, active }) => {
        if (item !== 'Blank' && active) {
          if (res?.[item]) {
            res[item] = { ...res[item], boostedValue: boostedValue + res[item]?.boostedValue };
          } else {
            const storageItem = calculateItemTotalAmount(state?.account?.storage, item, true);
            res[item] = { boostedValue, atomable: storageItem >= atomThreshold };
          }
        }
      })
      return res;
    }, {});
    const totalAtoms = calcAtoms(totals);
    return { ...totals, atom: totalAtoms }
  }
  const calcAtoms = (totals = {}) => {
    return Object.entries(totals)?.reduce((sum, [, { boostedValue, atomable }]) => {
      if (!atomable) return sum;
      sum.boostedValue += boostedValue / 10e6;
      return sum;
    }, { boostedValue: 0 });
  }
  const totals = useMemo(() => calcTotals(printer), [printer]);
  const highestBrr = getHighestMaxLevelTalentByClass(state?.characters, 2, 'Maestro', 'PRINTER_GO_BRRR');

  return <>
    <NextSeo
      title="Idleon Toolbox | Printer"
      description="Keep track of your printer output with calculated bonuses from various sources"
    />
    <Typography variant={'h2'} mb={3}>Printer</Typography>
    <Typography variant={'caption'} component={'div'} mb={3}>* hover over items to see boosted values (totals section
      will also show atom per day)</Typography>

    <Stack direction={'row'} alignItems={'baseline'} gap={1}>
      <Typography variant={'h4'}>Totals</Typography>
      <Typography variant={'caption'}>* per hour</Typography>
    </Stack>
    <Card sx={{ width: 'fit-content', mt: 1 }}><CardContent>
      <Typography>Atom Threshold: {notateNumber(atomThreshold)}</Typography>
    </CardContent></Card>
    <Stack direction={'row'} gap={2} sx={{ mt: 2, mb: 5 }} flexWrap={'wrap'}>
      {Object.entries(totals || {})?.map(([item, { boostedValue, atomable }], index) => {
        const isAtom = item === 'atom'
        return <Card key={'total' + item + index}>
          <Tooltip
            title={<TotalTooltip atomable={atomable} item={item} value={boostedValue} highestBrr={highestBrr}/>}>
            <CardContent>
              <Stack alignItems={'center'} justifyContent={'center'} sx={{ width: 50, height: 50 }}>
                <Stack sx={{ width: 42, height: 42 }} justifyContent={'center'} alignItems={'center'} flexShrink={0}>
                  <ItemIcon atom={isAtom}
                            src={`${prefix}${isAtom ? 'etc/Particle' : `data/${item}`}.png`} alt=""/>
                </Stack>
                <Stack direction={'row'} alignItems={'center'} gap={1}>
                  {atomable ? <img width={14} height={14} src={`${prefix}etc/Particle.png`} alt=''/> : null}
                  <Typography>{isAtom ? notateNumber(boostedValue, 'MultiplierInfo') : notateNumber(boostedValue)}</Typography>
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
        const printerSample = state?.characters?.[index]?.printerSample;
        const labBonusActive = (state?.characters?.[index]?.afkTarget === 'Laboratory' || isGodEnabledBySorcerer(state?.characters?.[index], 1) ||
          state?.account?.divinity?.linkedDeities?.[index] === 1) && wiredInBonus;
        return <Card sx={{ width: 'fit-content' }} key={`printer-row-${index}`}>
          <CardContent>
            <Stack direction='row' alignItems={'center'} gap={3}>
              <Stack sx={{ width: 175, textAlign: 'center', flexDirection: { xs: 'column', sm: 'row' } }}
                     alignItems={'center'} gap={2}>
                <Stack alignItems={'center'} justifyContent={'center'}>
                  <img className={'class-icon'} src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                </Stack>
                <Stack>
                  <Typography className={'character-name'}>{playerName}</Typography>
                  <Typography variant={'caption'}>Printer Sample: {printerSample}%</Typography>
                </Stack>
              </Stack>
              <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} justifyContent={'center'} gap={3}>
                {printerSlots?.map((slot, slotIndex) => {
                  return <Tooltip key={`${slot?.name}-${slotIndex}`} title={<BoostedTooltip {...slot}/>}>
                    <Card sx={{ borderColor: slot?.active ? 'success.light' : 'inherit' }}
                          elevation={slot?.active ? 0 : 5}
                          variant={slot?.active ? 'outlined' : 'elevation'}>
                      <CardContent>
                        {slot?.item !== 'Blank' ?
                          <Stack sx={{ width: 50, height: 50 }} position={'relative'} justifyContent={'flex-start'}
                                 alignItems={'center'}>
                            <ItemIcon src={`${prefix}data/${slot?.item}.png`} alt=""/>
                            <Typography
                              color={slot?.active && labBonusActive ? 'multiLight' : ''}>{notateNumber(slot?.value, 'Big')}</Typography>
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

const BoostedTooltip = ({ value, boostedValue, affectedBy }) => {
  return <Stack>
    <TitleAndValue boldTitle title={'Base value'} value={notateNumber(value, 'Big')}/>
    <TitleAndValue boldTitle title={'Boosted value'} value={notateNumber(boostedValue, 'Big')}/>
    {affectedBy.length > 0 ? <Stack>
      <Typography mt={1} sx={{ fontWeight: 'bold' }} variant={'subtitle1'}>Affected by:</Typography>
      {affectedBy?.map((by) => <Typography key={by} fontSize={14}>{by}</Typography>)}
    </Stack> : null}
  </Stack>
}

const TotalTooltip = ({ item, value, highestBrr, atomable }) => {
  const isAtom = item === 'atom';
  const perDay = value * 24;
  const atomPerDay = isAtom ? value * 24 : perDay / 10e6;
  const printerGoBrrr = growth(highestBrr?.funcX, highestBrr?.maxLevel, highestBrr?.x1, highestBrr?.x2, false);
  const perPrinterGoBrrr = value * printerGoBrrr;
  return <Stack gap={1}>
    {item !== 'atom' ? <Stack direction={'row'} gap={1} alignItems={'center'}>
      <img width={30} height={30} src={`${prefix}data/${item}.png`} alt=''/>
      <Typography>{notateNumber(perDay)} / day</Typography>
    </Stack> : null}
    {printerGoBrrr > 0 ? <Stack sx={{ ml: .5 }} direction={'row'} gap={2} alignItems={'center'}>
      <img width={24} height={24} src={`${prefix}data/UISkillIcon32.png`} alt=''/>
      <Typography>{notateNumber(perPrinterGoBrrr)} / printer go brr ({printerGoBrrr} hours) </Typography>
    </Stack> : null}
    {(atomable || isAtom) ? <Stack sx={{ ml: .5 }} direction={'row'} gap={2} alignItems={'center'}>
      <img width={24} height={24} src={`${prefix}etc/Particle.png`} alt=''/>
      <Typography>{notateNumber(atomPerDay, 'MultiplierInfo')} / day </Typography>
    </Stack> : null}
  </Stack>
}

const ItemIcon = styled.img`
  width: ${({ atom }) => atom ? 24 : 42}px;
  height: ${({ atom }) => atom ? 24 : 42}px;
`

export default Printer;
