import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import NumberField from '@components/common/NumberField';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import Notice from '@components/common/Notice';
import StatusText from '@components/common/StatusText';
import { cleanUnderscore, notateNumber } from '@utility/helpers';
import { getMaxDamage } from '@parsers/damage';
import {
  getStrongestAttack,
  getEffectiveDamage,
  getHitsToKill,
  getSkillDamage,
  getMinibosses,
  getMinibossHp,
  getMinibossPlayerInfo,
  getPickleCapForHits,
  getPickleCount,
  getPrayerHpMulti
} from '@parsers/misc/boneJoeCalculator';
import { monsterImage } from '@utility/spriteImages';

const hitsLabel = (hits) => {
  if (!isFinite(hits)) return 'no damage';
  if (hits <= 1) return '1 hit';
  return `${notateNumber(hits, 'Big')} hits`;
};

// Best case to worst case. They collapse to one number when nothing widens the gap, which is either
// a character with no attack equipped or a miniboss that dies in a single hit either way.
const rangeLabel = (skillHits, basicHits) => {
  if (!isFinite(skillHits) || !isFinite(basicHits)) return 'no damage';
  if (Math.ceil(skillHits) === Math.ceil(basicHits)) return hitsLabel(basicHits);
  return `${notateNumber(skillHits, 'Big')} to ${hitsLabel(basicHits)}`;
};

const CharacterTable = ({ characters, account, overridePickles, overrideHpMulti, targetHits }) => {
  const minibosses = getMinibosses();
  // Both are null together, but the pair is read rather than the toggle so this component never
  // has to know the toggle exists.
  const usingOverride = overridePickles !== null && overrideHpMulti !== null;
  const target = targetHits <= 1 ? 'in a single hit' : `within ${notateNumber(targetHits, 'Big')} hits`;
  // Each character priced once: the columns below only read these rows.
  const rows = characters.map((character) => {
    const playerInfo = getMaxDamage(character, characters, account) || {};
    const prayerHpMulti = usingOverride ? overrideHpMulti : getPrayerHpMulti(character, account);
    const carried = usingOverride ? overridePickles : getPickleCount(character);
    const bosses = Object.fromEntries(minibosses.map(({ rawName, baseHp }) => {
      const bossPlayerInfo = getMinibossPlayerInfo(playerInfo, rawName, account);
      const effectiveDamage = getEffectiveDamage(bossPlayerInfo, character);
      const hp = getMinibossHp(baseHp, prayerHpMulti, carried);
      return [rawName, {
        cap: getPickleCapForHits(effectiveDamage, baseHp, prayerHpMulti, targetHits),
        hits: getHitsToKill(hp, effectiveDamage),
        skillHits: getHitsToKill(hp, getSkillDamage(bossPlayerInfo, character))
      }];
    }));
    return { character, maxDamage: playerInfo?.maxDamage ?? 0, strongest: getStrongestAttack(character), carried, bosses };
  });
  const columns = [
    {
      key: 'character', label: 'Character', value: ({ character }) => character?.name,
      icon: ({ character }) => <GameIcon src={`data/ClassIcons${character?.classIndex}.png`} alt={''} size={32}/>
    },
    {
      key: 'damage', label: 'Damage', numeric: true, phone: true,
      render: ({ character, maxDamage, strongest }) => <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        {notateNumber(maxDamage, 'Big')}
        <InfoButton label={`${character?.name} damage`}>
          {strongest
            ? `Hit counts run from every hit being ${cleanUnderscore(strongest.name)} at ${notateNumber(strongest.multi * 100, 'Big')}% damage, the hardest of ${strongest.count} equipped attacks, up to basic attacks only. A real fight mixes both.`
            : 'No attack equipped, so hit counts are basic attacks only'}
        </InfoButton>
      </Box>
    },
    { key: 'pickles', label: 'Pickles', numeric: true, value: ({ carried }) => carried },
    // The header is the miniboss's sprite; its alt names it in the header and in the phone's detail list.
    ...minibosses.map(({ rawName, name }) => ({
      key: rawName,
      label: <img src={monsterImage(name)} alt={cleanUnderscore(name)} width={24} height={24} style={{ objectFit: 'contain' }}/>,
      numeric: true,
      render: ({ carried, bosses }) => {
        const { cap, hits, skillHits } = bosses[rawName];
        return <>
          <StatusText status={cap >= carried ? 'ready' : 'problem'}>{cap < 0 ? '-' : cap}</StatusText>
          <Typography variant={'caption'} color={'text.secondary'} component={'div'}>{rangeLabel(skillHits, hits)}</Typography>
        </>;
      }
    }))
  ];

  return <>
      <Typography variant={'caption'}>
        Each cell shows the most pickles that character can carry and still kill that miniboss {target}, counted
        with basic attacks and crits. Underneath is
        how many hits the kill takes at the pickles in the Pickles column, as a range. The low end
        assumes every hit is that character's hardest equipped attack, the high end assumes basic
        attacks only, and a real fight lands between them. Both ends count crits. Verminous ignores your
        damage stat: every character hits it with the Royal Guardian armory rat damage instead. {usingOverride
        ? 'Both are using the configuration above, not what each character actually has.'
        : 'Both are using each character\'s own equipped prayers and carried pickles.'}
      </Typography>
      <DataTable columns={columns} rows={rows} rowKey={(row) => row.character?.name}
                 rowLabel={(row) => row.character?.name}/>
  </>;
};

// The config inputs sit above this table and re-render the page on every keystroke, while pricing
// every character's damage here costs far more than one frame. React Compiler would memoize this
// boundary in the app, but tests run without it, so the guard is explicit rather than implied.
const MemoCharacterTable = React.memo(CharacterTable);

const CharacterMinibosses = ({
                               characters,
                               account,
                               overridePickles,
                               overrideHpMulti,
                               targetHits,
                               setTargetHits,
                               maxTargetHits,
                               debouncedTargetHits
                             }) => {
  return <Card>
    <CardContent>
      <Stack gap={2}>
        <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
          <Typography variant={'sectionTitle'} component={'h2'}>Your characters</Typography>
          {characters?.length ? <NumberField
            label={'Target hits'}
            sx={{ width: 120 }}
            min={1}
            max={maxTargetHits}
            integer
            help={false}
            value={targetHits}
            onChange={(next) => setTargetHits(next ?? 1)}
          /> : null}
        </Stack>
        {characters?.length
          ? <MemoCharacterTable
            characters={characters}
            account={account}
            overridePickles={overridePickles}
            overrideHpMulti={overrideHpMulti}
            targetHits={debouncedTargetHits}
          />
          : <Notice tone={'signin'}>How many pickles each character can carry shows here once you sign in.</Notice>}
      </Stack>
    </CardContent>
  </Card>;
};

export default CharacterMinibosses;
