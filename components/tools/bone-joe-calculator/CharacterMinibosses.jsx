import React from 'react';
import {
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { getMaxDamage } from '@parsers/damage';
import {
  getStrongestAttack,
  getEffectiveDamage,
  getHitsToKill,
  getSkillDamage,
  getMinibosses,
  getMinibossHp,
  getOneShotPickleCap,
  getPickleCount,
  getPrayerHpMulti
} from '@parsers/misc/boneJoeCalculator';

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

const CharacterMinibosses = ({ characters, account, overridePickles, overrideHpMulti }) => {
  const minibosses = getMinibosses();
  // Both are null together, but the pair is read rather than the toggle so this component never
  // has to know the toggle exists.
  const usingOverride = overridePickles !== null && overrideHpMulti !== null;

  return <Card>
    <CardContent>
      <Stack gap={2}>
        <Typography variant={'h6'}>Your characters</Typography>
        {characters?.length ? <>
          <Typography variant={'caption'}>
            Each cell shows the most pickles that character can carry and still one shot that miniboss. Underneath is
            how many hits the kill takes at the pickles in the Pickles column, as a range. The low end
            assumes every hit is that character's hardest equipped attack, the high end assumes basic
            attacks only, and a real fight lands between them. Both ends count crits. {usingOverride
            ? 'Both are using the configuration above, not what each character actually has.'
            : 'Both are using each character\'s own equipped prayers and carried pickles.'}
          </Typography>
          <TableContainer>
            <Table size={'small'}>
              <TableHead>
                <TableRow>
                  <TableCell>Character</TableCell>
                  <TableCell align={'right'}>Damage</TableCell>
                  <TableCell align={'right'}>Pickles</TableCell>
                  {minibosses.map(({ rawName, name }) => <TableCell key={rawName} align={'center'}>
                    <Tooltip title={cleanUnderscore(name)}>
                      <img src={`${prefix}afk_targets/${name}.png`} alt={cleanUnderscore(name)} width={28} height={28}
                           style={{ objectFit: 'contain' }}/>
                    </Tooltip>
                  </TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {characters.map((character) => {
                  const playerInfo = getMaxDamage(character, characters, account) || {};
                  const maxDamage = playerInfo?.maxDamage ?? 0;
                  const effectiveDamage = getEffectiveDamage(playerInfo, character);
                  const skillDamage = getSkillDamage(playerInfo, character);
                  const strongest = getStrongestAttack(character);
                  const prayerHpMulti = usingOverride ? overrideHpMulti : getPrayerHpMulti(character, account);
                  const carried = usingOverride ? overridePickles : getPickleCount(character);
                  return <TableRow key={character?.name}>
                    <TableCell>
                      <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <img src={`${prefix}data/ClassIcons${character?.classIndex}.png`} alt="" width={24}
                             height={24}/>
                        {character?.name}
                      </Stack>
                    </TableCell>
                    <TableCell align={'right'}>
                      <Stack direction={'row'} alignItems={'center'} justifyContent={'flex-end'} gap={0.5}>
                        {notateNumber(maxDamage, 'Big')}
                        <Tooltip title={strongest
                          ? `Hit counts run from every hit being ${cleanUnderscore(strongest.name)} at ${notateNumber(strongest.multi * 100, 'Big')}% damage, the hardest of ${strongest.count} equipped attacks, up to basic attacks only. A real fight mixes both.`
                          : 'No attack equipped, so hit counts are basic attacks only'}>
                          <InfoIcon fontSize={'small'} sx={{ color: 'text.secondary' }}/>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell align={'right'}>{carried}</TableCell>
                    {minibosses.map(({ rawName, baseHp }) => {
                      const cap = getOneShotPickleCap(maxDamage, baseHp, prayerHpMulti);
                      const hp = getMinibossHp(baseHp, prayerHpMulti, carried);
                      const hits = getHitsToKill(hp, effectiveDamage);
                      const skillHits = getHitsToKill(hp, skillDamage);
                      return <TableCell key={rawName} align={'center'}>
                        <Typography color={cap >= carried ? 'success.main' : 'error.main'}>
                          {cap < 0 ? '-' : cap}
                        </Typography>
                        <Typography variant={'caption'} color={'text.secondary'} component={'div'}>
                          {rangeLabel(skillHits, hits)}
                        </Typography>
                      </TableCell>;
                    })}
                  </TableRow>;
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </> : <Typography variant={'body2'}>Log in to see how many pickles each of your characters can carry.</Typography>}
      </Stack>
    </CardContent>
  </Card>;
};

// The config inputs sit above this table and re-render the page on every keystroke, while pricing
// every character's damage here costs far more than one frame. React Compiler would memoize this
// boundary in the app, but tests run without it, so the guard is explicit rather than implied.
export default React.memo(CharacterMinibosses);
