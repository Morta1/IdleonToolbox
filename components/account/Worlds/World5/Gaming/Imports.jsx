import { calculateSnailEncouragementForSuccessChance } from '../../../../../parsers/gaming';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getBitIndex, notateNumber, numberWithCommas, prefix } from '../../../../../utility/helpers';
import Timer from '../../../../common/Timer';
import Tooltip from '../../../../Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import styled from '@emotion/styled';
import React from 'react';
import useCheckbox from '@components/common/useCheckbox';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';

const Imports = ({ account, lastUpdated }) => {
  const [CheckboxEl, compactView] = useCheckbox('Compact view', true);
  const {
    snailLevel,
    snailEncouragement,
    imports,
    lastShovelClicked,
    goldNuggets,
    lastAcornClicked,
    acorns,
    nuggetsBreakpoints,
    acornsBreakpoints,
    bestNugget,
    poingHighscore,
    poingMulti
  } = account?.gaming || {};
  return (
    <>
      <CheckboxEl/>
      <Stack mt={2} direction={'row'} flexWrap={'wrap'} gap={2}>
        {imports?.map(({
                         boxName,
                         boxDescription,
                         name,
                         description,
                         majorBonus,
                         minorBonus,
                         cost,
                         rawName,
                         saveSprinklerChance,
                         acquired,
                         acornShop,
                         maxNuggetValue,
                         level
                       }, index) => {
          return <Card key={name} sx={{ width: 380 }} variant={acquired ? 'elevation' : 'outlined'}>
            <CardContent>
              <Stack>
                <Stack direction={'row'} alignItems={'center'} gap={2}>
                  <ImportImg src={`${prefix}data/${rawName}.png`} alt=""/>
                  <Typography>{cleanUnderscore(name)} ({cleanUnderscore(boxName)})</Typography>
                </Stack>
                {index !== 5 ? <Divider sx={{ my: 2 }}/> : null}
                {majorBonus || index === 6 ? <>
                  {index === 6 ? <>
                      <Typography>Highscore: {poingHighscore}</Typography>
                      <Typography>Multiplier: x{notateNumber(poingMulti, 'MultiplierInfo')}</Typography>
                    </> :
                    <Typography>{cleanUnderscore(majorBonus.split('|').join(' '))}</Typography>}
                  <Divider sx={{ my: 2 }}/> </> : null}
                <Typography>{cleanUnderscore(minorBonus)}</Typography>
                <Stack mt={1} direction={'row'} gap={1} alignItems={'center'}>
                  <img src={`${prefix}etc/Bits_${getBitIndex(cost)}.png`} alt="" style={{ objectFit: 'contain' }}/>
                  <Typography>{notateNumber(cost, 'bits')}</Typography>
                </Stack>
                {acquired && (index === 1 || index === 2) ? <Divider sx={{ my: 2 }}/> : null}
                {acquired && index === 1 ? <Nuggets account={account} bestNugget={bestNugget} lastUpdated={lastUpdated}
                                                    goldNuggets={goldNuggets}
                                                    lastShovelClicked={lastShovelClicked}
                                                    maxNuggetValue={maxNuggetValue}
                                                    nuggetsBreakpoints={nuggetsBreakpoints}/> : null}
                {acquired && index === 2 ? <Acorns acorns={acorns} lastUpdated={lastUpdated}
                                                   acornsBreakpoints={acornsBreakpoints}
                                                   lastAcornClicked={lastAcornClicked}/> : null}
                {acquired && index === 7 ? <Snail account={account} snailLevel={snailLevel}
                                                  snailEncouragement={snailEncouragement}/> : null}
                {saveSprinklerChance ? <Typography>Save sprinkler chance: {saveSprinklerChance}%</Typography> : null}
                {acornShop ? <AcornShop acornShop={acornShop}/> : null}
              </Stack>
              {compactView ? null : <Stack mt={'auto'}>
                <Divider sx={{ my: 2 }}/>
                <Typography mb={1} variant={'body2'}>Box info</Typography>
                <Stack>
                  <Typography variant={'caption'}>{cleanUnderscore(boxDescription)}</Typography>
                  <Typography mt={1} variant={'caption'}>{cleanUnderscore(description)}</Typography>
                </Stack>
              </Stack>}
            </CardContent>
          </Card>
        })}
      </Stack>
    </>
  );
};


const Snail = ({ account, snailLevel, snailEncouragement }) => {
  const successChance = Math.min(1, (1 - 0.1 * Math.pow(snailLevel, 0.72))
   * (1 + getSchematicBonus({ holesObject: account?.hole?.holesObject, t: 53, i: 0 }) / 100) * (1 + (100 * snailEncouragement) / (25 + snailEncouragement) / 100));
  const resetChance = Math.max(0, (Math.pow(snailLevel + 1, 0.07) - 1) / (1 + (300 * snailEncouragement) / (100 + snailEncouragement) / 100));
  const realResetChance = (resetChance * (1 - successChance));
  const averageAttempts = 1 / successChance;
  const succeedBeforeReset = 1 - Math.pow(1 - successChance, 1 / realResetChance);
  const encNeededForProbableSuccess = calculateSnailEncouragementForSuccessChance(snailLevel, 0.9);
  return <Stack>
    <Divider sx={{ my: 1 }}/>
    <TextAndValue title={'Level'} value={snailLevel}/>
    <TextAndValue title={'Encouragement'} value={snailEncouragement}/>
    <TextAndValue title={'Success chance'} value={`${notateNumber(successChance * 100, 'MultiplierInfo')}%`}/>
    <TextAndValue title={'Reset chance'} value={`${notateNumber(resetChance * 100, 'MultiplierInfo')}%`}/>
    <TextAndValue title={'Real Reset chance'} value={`${notateNumber(realResetChance * 100, 'MultiplierInfo')}%`}/>
    <TextAndValue title={'Avg # attempts'} value={notateNumber(averageAttempts, 'MultiplierInfo')}/>
    <TextAndValue title={'Chance to Succeed Before Reset'} value={notateNumber(succeedBeforeReset, 'MultiplierInfo')}/>
    <TextAndValue title={'Enc. needed for 90% success chance'}
                  value={notateNumber(encNeededForProbableSuccess, 'MultiplierInfo')}/>
  </Stack>
}

const TextAndValue = ({ title, value }) => {
  return <>
    <Stack direction={'row'} justifyContent={'space-between'}>
      <Typography variant={'body1'}>{title}:</Typography>
      <Typography variant={'body1'}>{value}</Typography>
    </Stack>
  </>
}

const Nuggets = ({
                   account,
                   goldNuggets,
                   nuggetsBreakpoints,
                   lastShovelClicked,
                   lastUpdated,
                   maxNuggetValue
                 }) => {
  return <>
    <Stack mt={1} direction={'row'} alignItems={'center'} gap={1}>
      <Timer date={new Date().getTime() - lastShovelClicked * 1000} lastUpdated={lastUpdated}/>
      <Tooltip title={<ResourcePerTime breakpoints={nuggetsBreakpoints}/>}>
        <IconInfoCircleFilled size={18}/>
      </Tooltip>
    </Stack>
    <Typography># of nuggets: {goldNuggets}</Typography>
    <Typography>Rolls
      possible: {(notateNumber(maxNuggetValue / 1584.89))}-{notateNumber(maxNuggetValue)}</Typography>
    <Typography>Nuggets since upgrade: {numberWithCommas(account?.accountOptions?.[192])}</Typography>
  </>
}

const Acorns = ({ lastAcornClicked, lastUpdated, acornsBreakpoints, acorns }) => {
  return <>
    <Stack mt={1} direction={'row'} gap={1}>
      <Timer date={new Date().getTime() - lastAcornClicked * 1000} lastUpdated={lastUpdated}/>
      <Tooltip title={<ResourcePerTime breakpoints={acornsBreakpoints}/>}>
        <IconInfoCircleFilled size={18}/>
      </Tooltip>
    </Stack>
    <Typography># of acorns: {numberWithCommas(acorns)}</Typography>
  </>
}
const AcornShop = ({ acornShop }) => {
  return <Stack>
    <Divider sx={{ my: 2 }}/>
    <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Acorn Shop</Typography>
    <Stack direction={'row'} gap={3}>
      {acornShop?.map(({ cost, bonus, description }, index) => <Stack key={'corn-' + index}>
        <Stack>
          <Typography variant={'body2'}>{description}</Typography>
          <Typography variant={'body2'}>Cost: {cost}</Typography>
        </Stack>
      </Stack>)}
    </Stack>
  </Stack>
}


const ResourcePerTime = ({ breakpoints }) => {
  return <Stack>
    <Typography sx={{ fontWeight: 'bold' }}>Breakpoints</Typography>
    {breakpoints?.map(({ time, amount }, index) => {
      const hours = Math.floor(time / 3600);
      const minutes = Math.round(time / 3600 % 1 * 60)
      return <Stack key={`bp-${index}`} direction={'row'} gap={2}>
        <Typography sx={{ width: 100 }}>{`${hours}h`}{minutes > 0 ? `:${minutes}m` : ''}</Typography>
        <Typography>{amount}</Typography>
      </Stack>
    })}
  </Stack>
}

const ImportImg = styled.img`
  width: 32px;
`;

export default Imports;
