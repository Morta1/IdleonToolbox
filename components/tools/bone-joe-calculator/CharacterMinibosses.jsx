import { Box, Stack, Typography } from '@mui/material';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import Notice from '@components/common/Notice';
import Panel from '@components/common/cards/Panel';
import StatusText from '@components/common/StatusText';
import { isSectionFailed } from '@components/common/styles';
import { cleanUnderscore, formatNum } from '@utility/helpers';
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
import { monsterSprite } from '@utility/spriteImages';
import usePageTop from '@hooks/usePageTop';

const hitsLabel = (hits) => {
  if (!isFinite(hits)) return 'no damage';
  if (hits <= 1) return '1 hit';
  return `${formatNum(hits, 'whole')} hits`;
};

// Best case to worst case. They collapse to one number when nothing widens the gap, which is either
// a character with no attack equipped or a miniboss that dies in a single hit either way. Two lines, and in the table no
// "hits" (the line above the table says what they count): one line of six digit ends took ten columns past 1366.
const rangeLabel = (skillHits, basicHits) => {
  if (!isFinite(skillHits) || !isFinite(basicHits)) return 'no damage';
  if (Math.ceil(skillHits) === Math.ceil(basicHits)) return hitsLabel(basicHits);
  return <>
    <Box component={'span'} sx={{ display: 'block' }}>{formatNum(skillHits, 'whole')} to </Box>
    <Box component={'span'} sx={{ display: 'block' }}>
      {formatNum(basicHits, 'whole')}<Box component={'span'} sx={{ display: { md: 'none' } }}> hits</Box>
    </Box>
  </>;
};

const CharacterTable = ({ characters, account, overridePickles, overrideHpMulti, targetHits }) => {
  const pageTop = usePageTop();
  const minibosses = getMinibosses();
  // Both are null together, but the pair is read rather than the toggle so this component never
  // has to know the toggle exists.
  const usingOverride = overridePickles !== null && overrideHpMulti !== null;
  const target = targetHits <= 1 ? 'in a single hit' : `within ${formatNum(targetHits, 'whole')} hits`;
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
        skillHits: getHitsToKill(hp, getSkillDamage(bossPlayerInfo, character)),
        known: Number.isFinite(effectiveDamage)
      }];
    }));
    return { character, maxDamage: playerInfo?.maxDamage ?? 0, strongest: getStrongestAttack(character), carried, bosses };
  });
  const columns = [
    {
      key: 'character', label: 'Character', value: ({ character }) => cleanUnderscore(character?.name),
      icon: ({ character }) => <GameIcon src={`data/ClassIcons${character?.classIndex}.png`} alt={''} size={24}/>
    },
    {
      key: 'damage', label: 'Damage', numeric: true, phone: true,
      // A failed section upstream of the damage reads "-": no number, so no note on how a number was counted
      render: ({ character, maxDamage, strongest }) => (Number.isFinite(maxDamage) ? <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        {formatNum(maxDamage)}
        <InfoButton label={`${cleanUnderscore(character?.name)} damage`}>
          {strongest
            ? `Hit counts run from every hit being ${cleanUnderscore(strongest.name)} at ${formatNum(strongest.multi * 100, 'pct')} damage, the hardest of ${strongest.count} equipped attacks, up to basic attacks only. A real fight mixes both.`
            : 'No attack equipped, so hit counts are basic attacks only'}
        </InfoButton>
      </Box> : null)
    },
    { key: 'pickles', label: 'Pickles', numeric: true, value: ({ carried }) => formatNum(carried, 'whole') },
    // The header is the miniboss's sprite; the phone's list, which has no room to guess, names it in words too.
    ...minibosses.map(({ rawName, name }) => ({
      key: rawName,
      label: <GameIcon src={monsterSprite(name)} size={24} alt={cleanUnderscore(name)}/>,
      detailLabel: <Stack component={'span'} direction={'row'} gap={0.5} alignItems={'center'}>
        <GameIcon src={monsterSprite(name)} size={16} alt={''}/>
        {cleanUnderscore(name)}
      </Stack>,
      numeric: true,
      cellSx: { px: 0.5 },
      render: ({ carried, bosses }) => {
        const { cap, hits, skillHits, known } = bosses[rawName];
        if (!known) return null;
        return <>
          <StatusText status={cap >= carried ? 'ready' : 'problem'}>{cap < 0 ? '-' : formatNum(cap, 'whole')}</StatusText>
          <Typography variant={'caption'} color={'text.secondary'} component={'div'}>{rangeLabel(skillHits, hits)}</Typography>
        </>;
      }
    }))
  ];

  return <>
    <Typography variant={'body2'} color={'text.secondary'} sx={{ p: 2 }}>
      Each cell shows the most pickles that character can carry and still kill that miniboss {target}, counted
      with basic attacks and crits. Underneath is
      how many hits the kill takes at the pickles in the Pickles column, as a range. The low end
      assumes every hit is that character's hardest equipped attack, the high end assumes basic
      attacks only, and a real fight lands between them. Both ends count crits. Verminous ignores your
      damage stat: every character hits it with the Royal Guardian armory rat damage instead. {usingOverride
      ? 'Both are using the configuration above, not what each character actually has.'
      : 'Both are using each character\'s own equipped prayers and carried pickles.'}
    </Typography>
    <DataTable columns={columns} rows={rows} rowKey={(row) => row.character?.name} dense
               rowLabel={(row) => cleanUnderscore(row.character?.name)} stickyTop={pageTop}/>
  </>;
};

const CharacterMinibosses = ({
                               characters,
                               account,
                               overridePickles,
                               overrideHpMulti,
                               debouncedTargetHits
                             }) => {
  const hasCharacters = Boolean(characters?.length);
  // The damage chain reads the hole's schematics and throws without them, so it is never asked
  const holeFailed = isSectionFailed(account, 'hole');
  const wholeParseFailed = account?.failedSections?.includes('*');
  return <Panel title={'Your characters'}>
    {holeFailed && hasCharacters ? <Typography variant={'body2'} color={'text.secondary'} sx={{ p: 2 }}>
      Couldn't work out your characters' damage: the hole section failed to load.
    </Typography> : null}
    {!holeFailed && hasCharacters ? <CharacterTable
      characters={characters}
      account={account}
      overridePickles={overridePickles}
      overrideHpMulti={overrideHpMulti}
      targetHits={debouncedTargetHits}
    /> : null}
    {!hasCharacters ? <Box sx={{ p: 2 }}>
      {wholeParseFailed
        ? <Typography variant={'body2'} color={'text.secondary'}>Your characters failed to load.</Typography>
        : <Notice tone={'signin'}>How many pickles each character can carry shows here once you sign in.</Notice>}
    </Box> : null}
  </Panel>;
};

export default CharacterMinibosses;
