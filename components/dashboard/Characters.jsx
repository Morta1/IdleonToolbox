import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Card, Divider, Group, Stack, Text } from '@mantine/core';
import { cleanUnderscore, kFormatter, notateNumber, pascalCase, prefix } from '../../utility/helpers';
import styled from '@emotion/styled';
import {
  alchemyAlerts,
  anvilAlerts,
  cardsAlert,
  crystalCountdownAlerts,
  getDivinityAlert,
  getEquipmentAlert,
  obolsAlerts,
  postOfficeAlerts,
  starSignsAlerts,
  talentsAlerts,
  toolsAlerts,
  trapsAlerts,
  worshipAlerts
} from '@utility/dashboard/characters';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Timer from '../common/Timer';
import { TitleAndValue } from '../common/styles';
import { getAfkGain, getCashMulti, getDropRate, getRespawnRate } from '@parsers/character';
import { getMaxDamage, notateDamage } from '@parsers/damage';
import { differenceInMinutes } from 'date-fns';
import CustomHoverCard from '@components/HoverCard';

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
  talents: talentsAlerts,
  cards: cardsAlert,
  divinityStyle: getDivinityAlert,
  equipment: getEquipmentAlert
}

const Characters = ({ characters = [], account, lastUpdated, trackers }) => {
  return <>
    <Group gap={'xs'} align={'normal'}>
      {characters?.map((character, characterIndex) => {
        const {
          name,
          classIndex,
          afkTarget,
          afkTime,
          postOffice
        } = character;
        const options = Object.entries(trackers || {})?.reduce((result, [trackerName, data]) => {
          const { options, ...rest } = data;
          const optionObject = data?.options?.reduce((result, option) => ({
            ...result,
            [option?.name]: option
          }), {});
          return { ...result, [trackerName]: { ...rest, ...optionObject } }
        }, {});
        const alerts = Object.keys(options)?.reduce((result, trackerName) => {
          result[trackerName] = alertsMap?.[trackerName]?.(account, characters, character, lastUpdated, options) || {};
          return result;
        }, {})
        const isActive = () => {
          const timePassed = new Date().getTime() + (afkTime - lastUpdated);
          const minutes = differenceInMinutes(new Date(), new Date(timePassed));
          return minutes <= 5;
        };
        const activity = afkTarget && afkTarget !== '_' ? afkTarget : 'Nothing';
        return <Card key={name} w={300} data-cy={`character-${name}`} withBorder shadow={'xs'}>
          <Group alignItems={'center'} gap={'xs'} flexWrap={'wrap'}>
            <Box sx={{ display: { sm: 'none', md: 'block' } }}>
              <img src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
            </Box>
            <Stack gap={0}>
              <Text>{name}</Text>
              {isActive() ? <Text>Active</Text> : <Timer variant={'caption'} type={'up'} date={afkTime}
                                                         lastUpdated={lastUpdated}/>}
            </Stack>
            <Group alignItems="center" gap={'xs'} style={{ marginLeft: 'auto' }}>
              <CustomHoverCard dropdown={cleanUnderscore(activity)}>
                <IconImg src={`${prefix}afk_targets/${activity}.png`} alt="activity icon"/>
              </CustomHoverCard>
              <CustomHoverCard dropdown={<CharacterInfo characters={characters}
                                                        account={account} character={character}
                                                        lastUpdated={lastUpdated}/>}>
                <IconInfoCircleFilled/>
              </CustomHoverCard>
            </Group>
          </Group>
          <Divider my={'xs'}/>
          <Group gap={'xs'} wrap={'wrap'}>
            {trackers?.worship && alerts?.worship?.unendingEnergy ?
              <Alert title={`${name} has unending energy prayer and is afk for more than 10 hours`}
                     iconPath={'data/Prayer2'}/> : null}
            {trackers?.divinityStyle && Object.keys(alerts?.divinityStyle).length ?
              <Alert title={`${name} ${alerts?.divinityStyle?.text}`}
                     iconPath={`etc/${alerts?.divinityStyle?.icon}`}/> : null}
            {trackers?.worship && alerts?.worship?.chargeOverdue ?
              <Alert title={`${name} worship is full`} iconPath={'data/ClassIcons50'}/> : null}
            {trackers?.traps && alerts?.traps?.trapsOverdue ?
              <Alert title={`${name} traps are overdue`} iconPath={'data/TrapBoxSet1'}/> : null}
            {trackers?.traps && alerts?.traps?.missingTraps ?
              <Alert title={`${name} is missing a trap`} iconPath={'data/ClassIcons48'}/> : null}
            {trackers?.alchemy && alerts?.alchemy?.missingBubbles ?
              <Alert title={`${name} is missing an active bubble`} iconPath={'data/aJarB0'}/> : null}
            {trackers?.alchemy && alerts?.alchemy?.noActivity ?
              <Alert title={`${name} is not doing any alchemy activity`} iconPath={'etc/NoAlcActivity'}/> : null}
            {trackers?.cards && alerts?.cards?.cardSet ?
              <Alert title={alerts?.cards?.cardSet?.text}
                     iconPath={`data/${character?.cards?.cardSet?.rawName || 'CardSet0'}`}/> : null}
            {trackers?.cards && alerts?.cards?.passiveCards ?
              <Alert title={`${name} has a passive card equipped`}
                     iconPath={`etc/PassiveCard`}/> : null}
            {trackers?.obols && alerts?.obols?.missingObols?.length > 0 ?
              <Alert title={`${name} has ${alerts?.obols?.missingObols?.length} empty obol slots`}
                     iconPath={'data/ObolLocked1'}/> : null}
            {trackers?.postOffice && alerts?.postOffice?.unspentPoints ?
              <Alert title={`${name} has ${Math.floor(postOffice?.unspentPoints)} unspent points`}
                     iconPath={'data/UIboxUpg0'}/> : null}
            {trackers?.anvil && alerts?.anvil?.missingHammers > 0 ?
              <Alert title={`${name} is missing ${alerts?.anvil?.missingHammers} hammers`}
                     iconPath={'data/GemP1'}/> : null}
            {trackers?.anvil && alerts?.anvil?.unspentPoints > 0 ?
              <Alert title={`${name} has ${alerts?.anvil?.unspentPoints} unspent points anvil points`}
                     iconPath={'data/ClassIcons43'}/> : null}
            {trackers?.equipment && alerts?.equipment?.availableUpgradesSlots?.length > 0 ?
              alerts?.equipment?.availableUpgradesSlots?.map(({
                                                                displayName,
                                                                rawName,
                                                                Upgrade_Slots_Left
                                                              }, index) => {
                return <Alert key={`slots-${name}-${characterIndex}-${rawName}-${index}`}
                              title={`${cleanUnderscore(displayName)} has ${Upgrade_Slots_Left} available upgrade slots`}
                              extra={<Box style={{
                                position: 'absolute',
                                width: 5,
                                height: 5,
                                top: -2,
                                right: -2,
                                borderRadius: '50%',
                                backgroundColor: '#d62727'
                              }}/>}
                              iconPath={`data/${rawName}`}/>;
              }) : null}
            {trackers?.anvil && alerts?.anvil?.anvilOverdue?.length > 0 ?
              alerts?.anvil?.anvilOverdue?.map(({ diff, name, rawName }) => {
                const isFull = diff <= 0;
                return <Alert key={`${name}-${characterIndex}`}
                              title={`${cleanUnderscore(name)} ${isFull
                                ? 'production is full'
                                : `is ${diff} minutes away from being full`}`}
                              iconPath={`data/${rawName}`}/>;
              }) : null}
            {trackers?.starSigns && alerts?.starSigns?.missingStarSigns > 0 ?
              <Alert title={`${name} is missing ${alerts?.starSigns?.missingStarSigns} star signs`}
                     iconPath={'data/SignStar1b'}/> : null}
            {trackers?.talents && alerts?.talents?.length > 0 ? alerts?.talents?.map(({
                                                                                        name,
                                                                                        skillIndex,
                                                                                        cooldown
                                                                                      }, index) => (
              <Alert key={skillIndex + '-' + index}
                     style={{ opacity: cooldown > 0 ? .5 : 1 }}
                     title={cooldown > 0
                       ? <Timer type={'countdown'}
                                date={cooldown} lastUpdated={lastUpdated}/>
                       : `${cleanUnderscore(pascalCase(name))} is ready`}
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
                const ready = crystalCountdown > 0 && reduction >= crystalCountdown;
                if (!showMaxed && ready || !showNonMaxed && (showMaxed && !ready) || (!showNonMaxed && !showMaxed)) return null;
                return <Alert key={icon + '-' + index + '-' + characterIndex}
                              style={{
                                border: '1px solid',
                                borderColor: ready ? '#66bb6a' : reduction > 0 ? '#d1921e' : '',
                                borderRadius: 5,
                                opacity: ready || reduction > 0 ? 1 : .5
                              }}
                              title={`Crystal CD for ${cleanUnderscore(pascalCase(name))} is ${ready
                                ? 'maxed'
                                : ''} ${Math.round(reduction * 100) / 100}% ${!ready
                                ? `(Max: ${Math.round(crystalCountdown * 100) / 100})`
                                : ''}`}
                              iconPath={`data/${icon}`}/>
              }
            ) : null}
          </Group>
        </Card>
      })}
    </Group>
  </>
};

const Alert = ({ title, iconPath, style = {}, extra }) => {
  return <Group style={{ position: 'relative' }}>
    <CustomHoverCard dropdown={title}>
      <IconImg style={style} src={`${prefix}${iconPath}.png`} alt=""/>
    </CustomHoverCard>
    {extra}
  </Group>
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
  return (
    (<Stack gap={1}>
      <TitleAndValue title={name} value={`lv. ${stats?.level || 0}`}/>
      <TitleAndValue title={'Afk time'}
                     value={isActive() ? <Typography>Active</Typography> : <Timer type={'up'} date={afkTime}
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
    </Stack>)
  );
}

const IconImg = styled.img`
  width: 30px;
  height: 30px;
  object-fit: contain;
`;

export default Characters;
