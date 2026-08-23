import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import { notateNumber, commaNotation, prefix } from '@utility/helpers';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Worlds/World7/ClamWork/Upgrades';
import Compensations from '@components/account/Worlds/World7/ClamWork/Compensations';
import UpgradeOptimizer from '@components/account/Worlds/World7/ClamWork/UpgradeOptimizer';
import { DEFAULT_CLAM_MULTIKILL, getClamHp, parseClamWork } from '@parsers/world-7/clamWork';
import { getClamworksMultiKill, getMaxDamage } from '@parsers/damage';
import { useLocalStorage } from '@mantine/hooks';

const CLAMWORKS_MAP_INDEX = 306;

const ClamWork = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const characters = state?.characters;
  const [selectedChar, setSelectedChar] = useLocalStorage({
    key: 'clamWork:selectedChar',
    defaultValue: null
  });
  const [multiKillInput, setMultiKillInput] = useLocalStorage({
    key: 'clamWork:multiKill',
    defaultValue: null
  });

  if (!state?.account?.clamWork) return <MissingData name={'clamWork'} />;

  // Default to whoever is parked at the Clamworks, since that is the character the game reads
  // multikill from for MULTI-SCALPING.
  const character = characters?.find((char) => char?.playerId === selectedChar)
    ?? characters?.find((char) => char?.mapIndex === CLAMWORKS_MAP_INDEX)
    ?? characters?.[0];

  const workerClass = account?.clamWork?.workerClass ?? 0;
  const playerInfo = character ? getMaxDamage(character, characters, account) : null;
  const suggestedMultiKill = playerInfo
    ? getClamworksMultiKill(character, characters, account, getClamHp(workerClass), playerInfo.maxDamage)
    : DEFAULT_CLAM_MULTIKILL;
  const multiKill = multiKillInput ?? suggestedMultiKill;

  const {
    promotionChance,
    promotionCost,
    clamHp,
    mobs,
    pearlValue,
    blackPearlValue,
    upgrades,
    ownedPearls,
    compensations,
    respawn
  } = parseClamWork(account, null, multiKill);

  // The optimizer walks account.clamWork.upgrades, so it has to see the multikill-aware levels too.
  const optimizerAccount = { ...account, clamWork: { ...account?.clamWork, upgrades } };

  return <>
    <NextSeo
      title="Clam Work | Idleon Toolbox"
      description="Track your Clam Work upgrade levels, pearl bonuses, and progression in Legends of Idleon World 7"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue
        title={'Worker Class'}
        value={`Lv. ${workerClass ?? 0}`}
      />
      <CardTitleAndValue
        title={'Owned Pearls'}
        value={notateNumber(ownedPearls ?? 0, 'Big')}
        icon={'data/ClamPearl0.png'}
        imgStyle={{ width: 24, height: 24 }}
      />
      <CardTitleAndValue
        title={'Promotion Chance'}
        value={`${((promotionChance ?? 0) * 100).toFixed(2)}%`}
      />
      <CardTitleAndValue
        title={'Promotion Cost'}
        value={1e6 > (promotionCost ?? 0)
          ? commaNotation(promotionCost ?? 0)
          : notateNumber(promotionCost ?? 0, 'Big')}
      />
      <CardTitleAndValue
        title={'Pearl Value Multiplier'}
        value={notateNumber(pearlValue ?? 1, 'Big')}
      />
      <CardTitleAndValue
        title={'Black Pearl Value'}
        value={notateNumber(blackPearlValue ?? 50, 'Big')}
      />
      <CardTitleAndValue
        title={'Clam Mobs'}
        value={commaNotation(mobs ?? 0)}
      />
      <CardTitleAndValue
        title={'Clam HP'}
        value={notateNumber(clamHp ?? 0, 'Big')}
      />
      <CardTitleAndValue
        title={'Respawn Time'}
        value={`${respawn ?? 60}s`}
      />
    </Stack>

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'} mb={3}>
      <CardTitleAndValue
        title={<Stack component={'span'} direction={'row'} alignItems={'center'} gap={1}>
          Clamworks Character
          <Tooltip title={'MULTI-SCALPING scales with the multikill of the character farming the Clamworks'}>
            <IconInfoCircleFilled size={16} />
          </Tooltip>
        </Stack>}
        value={<Select size={'small'}
                       value={character?.playerId ?? ''}
                       onChange={(e) => setSelectedChar(e.target.value)}>
          {characters?.map((char, index) => (
            <MenuItem key={char?.name + index} value={char?.playerId}>
              <Stack direction={'row'} alignItems={'center'} gap={2}>
                <img src={`${prefix}data/ClassIcons${char?.classIndex}.png`} alt="" width={32} height={32} />
                <Typography>{char?.name}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </Select>}
      />
      <CardTitleAndValue
        title={<Stack component={'span'} direction={'row'} alignItems={'center'} gap={1}>
          Multikill
          <Tooltip
            title={`Calculated against clam HP for ${character?.name ?? 'this character'}. Override it with the number the game shows on the Clamworks map.`}>
            <IconInfoCircleFilled size={16} />
          </Tooltip>
        </Stack>}
        value={<Stack direction={'row'} gap={1} alignItems={'center'}>
          <TextField
            size={'small'}
            type={'number'}
            sx={{ width: 120 }}
            inputProps={{ min: 0 }}
            placeholder={`${suggestedMultiKill}`}
            value={multiKillInput ?? ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setMultiKillInput(isNaN(value) ? null : Math.max(0, value));
            }}
          />
          {multiKillInput !== null && multiKillInput !== undefined
            ? <Typography variant={'caption'} color={'text.secondary'}>auto: {suggestedMultiKill}</Typography>
            : null}
        </Stack>}
      />
    </Stack>

    <Tabber tabs={['Upgrades', 'Upgrade Optimizer', 'Compensations']}>
      <Upgrades upgrades={upgrades} account={account} />
      <UpgradeOptimizer character={character} account={optimizerAccount} multiKill={multiKill} />
      <Compensations compensations={compensations} />
    </Tabber>
  </>;
};

export default ClamWork;
