import React, { useMemo } from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, kFormatter, notateNumber, pascalCase, prefix } from '../../utility/helpers';
import styled from '@emotion/styled';
import HtmlTooltip from '../Tooltip';
import {
  alchemyAlerts,
  anvilAlerts,
  crystalCountdownAlerts,
  obolsAlerts,
  postOfficeAlerts,
  starSignsAlerts,
  talentsAlerts,
  toolsAlerts,
  trapsAlerts,
  worshipAlerts
} from '../../utility/dashboard/characters';
import InfoIcon from '@mui/icons-material/Info';
import Timer from '../common/Timer';
import { TitleAndValue } from '../common/styles';
import { getAfkGain, getCashMulti, getDropRate, getRespawnRate } from '../../parsers/character';
import { getMaxDamage, notateDamage } from '../../parsers/damage';
import { differenceInMinutes } from 'date-fns';

const alertsMap = {
  anvil: anvilAlerts,
  worship: worshipAlerts,
  traps: trapsAlerts,
  alchemy: alchemyAlerts,
  obols: obolsAlerts,
  postOffice: postOfficeAlerts,
  starSigns: starSignsAlerts,
  crystalCountdown: crystalCountdownAlerts,
  tools: toolsAlerts,
  talents: talentsAlerts
}

const Characters = ({ characters = [], account, lastUpdated, trackers }) => {
  return <>
    <Stack gap={2} direction={'row'} flexWrap={'wrap'}>
      {characters?.map((character, characterIndex) => {
        const {
          name,
          classIndex,
          afkTarget,
          postOffice,
        } = character;
        const options = Object.entries(trackers || {})?.reduce((result, [trackerName, data]) => {
          const optionObject = data?.options?.reduce((result, option) => ({
            ...result,
            [option?.name]: option
          }), {});
          return { ...result, [trackerName]: optionObject }
        }, {});
        const alerts = Object.keys(options)?.reduce((result, trackerName) => {
          result[trackerName] = alertsMap?.[trackerName](account, characters, character, lastUpdated, options) || {};
          return result;
        }, {})
        const activity = afkTarget && afkTarget !== '_' ? afkTarget : 'Nothing';
        return <Card key={name} sx={{ width: 300 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
              <Box sx={{ display: { sm: 'none', md: 'block' } }}><img src={`${prefix}data/ClassIcons${classIndex}.png`}
                                                                      alt=""/></Box>
              <Typography>{name}</Typography>
              <Stack direction={'row'} alignItems="center" gap={1} style={{ marginLeft: 'auto' }}>
                <HtmlTooltip title={cleanUnderscore(activity)}>
                  <IconImg src={`${prefix}afk_targets/${activity}.png`} alt="activity icon"
                  />
                </HtmlTooltip>
                <HtmlTooltip title={<CharacterInfo characters={characters} account={account} character={character}
                                                   lastUpdated={lastUpdated}/>}>
                  <InfoIcon/>
                </HtmlTooltip>
              </Stack>
            </Stack>
            <Divider sx={{ my: 1 }}/>
            <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
              {trackers?.worship && alerts?.worship?.unendingEnergy ?
                <Alert title={`${name} has unending energy prayer and is afk for more than 10 hours!`}
                       iconPath={'data/Prayer2'}/> : null}
              {trackers?.worship && alerts?.worship?.chargeOverdue ?
                <Alert title={`${name} worship is full!`} iconPath={'data/ClassIcons50'}/> : null}
              {trackers?.traps && alerts?.traps?.trapsOverdue ?
                <Alert title={`${name} traps are overdue!`} iconPath={'data/TrapBoxSet1'}/> : null}
              {trackers?.traps && alerts?.traps?.missingTraps ?
                <Alert title={`${name} is missing a trap!`} iconPath={'data/ClassIcons48'}/> : null}
              {trackers?.alchemy && alerts?.alchemy?.missingBubbles ?
                <Alert title={`${name} is missing an active bubble!`} iconPath={'data/aJarB0'}/> : null}
              {trackers?.obols && alerts?.obols?.missingObols?.length > 0 ?
                <Alert title={`${name} has ${alerts?.obols?.missingObols?.length} empty obol slots!`}
                       iconPath={'data/ObolLocked1'}/> : null}
              {trackers?.postOffice && alerts?.postOffice?.unspentPoints ?
                <Alert title={`${name} has ${Math.floor(postOffice?.unspentPoints)} unspent points`}
                       iconPath={'data/UIboxUpg0'}/> : null}
              {trackers?.anvil && alerts?.anvil?.missingHammers > 0 ?
                <Alert title={`${name} is missing ${alerts?.anvil?.missingHammers} hammers`}
                       iconPath={'data/GemP1'}/> : null}
              {trackers?.anvil && alerts?.anvil?.anvilOverdue?.length > 0 ?
                alerts?.anvil?.anvilOverdue?.map(({ diff, name, rawName }) => {
                  const isFull = diff <= 0;
                  return <Alert key={`${name}-${characterIndex}`}
                                title={`${cleanUnderscore(name)} ${isFull
                                  ? 'production is full!'
                                  : `is ${diff} minutes away from being full!`}`}
                                iconPath={`data/${rawName}`}/>;
                }) : null}
              {trackers?.starSigns && alerts?.starSigns?.missingStarSigns > 0 ?
                <Alert title={`${name} is missing ${alerts?.starSigns?.missingStarSigns} star signs!`}
                       iconPath={'data/SignStar1b'}/> : null}
              {trackers?.talents && alerts?.talents?.length > 0 ? alerts?.talents?.map(({
                                                                                          name,
                                                                                          skillIndex
                                                                                        }, index) => (
                <Alert key={skillIndex + '-' + index} title={`${cleanUnderscore(pascalCase(name))} is ready!`}
                       iconPath={`data/UISkillIcon${skillIndex}`}/>
              )) : null}
              {trackers?.tools?.checked && alerts?.tools?.length > 0 ? alerts?.tools?.map(({
                                                                                             rawName,
                                                                                             displayName
                                                                                           }, index) => (
                <Alert key={`${character?.name}-${rawName}-${index}`}
                       title={`${character?.name} can equip ${cleanUnderscore(pascalCase(displayName))}`}
                       iconPath={`data/${rawName}`}/>
              )) : null}
              {trackers?.crystalCountdown && alerts?.crystalCountdown?.length > 0 ? alerts?.crystalCountdown?.map(({
                                                                                                                     name,
                                                                                                                     icon,
                                                                                                                     reduction,
                                                                                                                     crystalCountdown
                                                                                                                   }, index) => {
                  let { showMaxed, showNonMaxed } = options?.crystalCountdown || {};
                  showMaxed = showMaxed?.checked;
                  showNonMaxed = showNonMaxed?.checked;
                  const ready = crystalCountdown > 0 && reduction === crystalCountdown;
                  if (!showMaxed && ready || !showNonMaxed && (showMaxed && !ready) || (!showNonMaxed && !showMaxed)) return null;
                  return <Alert key={icon + '-' + index + '-' + characterIndex}
                                style={{ border: '1px solid #fbb9b9', borderRadius: 5, opacity: ready ? 1 : .5 }}
                                title={`Crystal CD for ${cleanUnderscore(pascalCase(name))} is ${ready
                                  ? 'maxed'
                                  : ''} ${notateNumber(reduction, 'Smaller')}% ${!ready
                                  ? `(Max: ${notateNumber(crystalCountdown, 'Smaller')})`
                                  : ''}!`}
                                iconPath={`data/${icon}`}/>
                }
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const Alert = ({ title, iconPath, style = {} }) => {
  return <HtmlTooltip title={title}>
    <IconImg style={style} src={`${prefix}${iconPath}.png`} alt=""/>
  </HtmlTooltip>
}

const CharacterInfo = ({ account, characters, character, lastUpdated }) => {
  const {
    name,
    stats,
    afkTime,
    crystalSpawnChance,
    nonConsumeChance
  } = character || {};
  const { cashMulti } = useMemo(() => getCashMulti(character, account, characters) || {},
    [character, account]);
  const { dropRate } = useMemo(() => getDropRate(character, account, characters) || {},
    [character, account]);
  const { respawnRate } = useMemo(() => getRespawnRate(character, account) || {},
    [character, account]);
  const { afkGains } = useMemo(() => getAfkGain(character, characters, account), [character,
    account]);
  const playerInfo = useMemo(() => getMaxDamage(character, characters, account), [character, account]);
  const isActive = () => {
    const timePassed = new Date().getTime() + (afkTime - lastUpdated);
    const minutes = differenceInMinutes(new Date(), new Date(timePassed));
    return minutes <= 5;
  };
  return <Stack gap={1}>
    <TitleAndValue title={name} value={`lv. ${stats?.level || 0}`}/>
    <TitleAndValue title={'Afk time'}
                   value={isActive ? <Typography>Active</Typography> : <Timer type={'up'} date={afkTime}
                                                                              lastUpdated={lastUpdated}/>}/>
    <Divider flexItem sx={{ background: 'black' }}/>
    <TitleAndValue title={'Damage'} value={notateDamage(playerInfo)?.at(0)?.replace(/\[/g, 'M')}/>
    <TitleAndValue title={'Hp'} value={notateNumber(playerInfo?.maxHp)}/>
    <TitleAndValue title={'Mp'} value={notateNumber(playerInfo?.maxMp)}/>
    <TitleAndValue title={'Accuracy'} value={notateNumber(playerInfo?.accuracy)}/>
    <TitleAndValue title={'Movement Speed'} value={notateNumber(playerInfo?.movementSpeed)}/>
    <Divider flexItem sx={{ background: 'black' }}/>
    <TitleAndValue title={'Cash multi'} value={`${notateNumber(cashMulti)}%`}/>
    <TitleAndValue title={'Drop rate'} value={`${notateNumber(dropRate, 'MultiplierInfo')}x`}/>
    <TitleAndValue title={'Respawn rate'} value={`${notateNumber(respawnRate, 'MultiplierInfo')}%`}/>
    <TitleAndValue title={'Afk gains'} value={`${notateNumber(afkGains * 100, 'MultiplierInfo')}%`}/>
    <TitleAndValue title={'Crystal Chance'} value={(1 / crystalSpawnChance?.value) < 100
      ?
      `${notateNumber(crystalSpawnChance?.value * 100, 'MultiplierInfo')?.replace('.00', '')}%`
      : `1 in ${Math.floor(1 / crystalSpawnChance?.value)}`}/>
    <TitleAndValue title={'Non consume chance'} value={`${kFormatter(nonConsumeChance, 2)}%`}/>
  </Stack>
}

const IconImg = styled.img`
  width: 30px;
  height: 30px;
  object-fit: contain;
`;

export default Characters;
