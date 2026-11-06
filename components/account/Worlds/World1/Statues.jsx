import { Box, capitalize, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, pascalCase } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import { getStatueBonus } from '@parsers/world-1/statues';
import { getStatueFlairExpMulti, getStatueFlairLevel } from '@parsers/class-specific/royalGuardian';
import { isSectionFailed } from '@components/common/styles';

const statueName = (name) => `${capitalize(cleanUnderscore(`${name ?? ''}`.toLowerCase()))} Statue`;
// The statue's sentence: its @ filled with the bonus to a tenth (the old tooltip's fill; the walk compares the game's)
const statueSentence = (effect, bonus) => cleanUnderscore(pascalCase(`${effect ?? ''}`.replace(/(%?)(@)/, '$2$1_')
  .replace('@', Math.floor(10 * bonus) / 10)));
// The sentence without its number: "Fishing Power"
const statueBonusName = (effect) => cleanUnderscore(pascalCase(`${effect ?? ''}`.replace(/%?@/, '')));

const statueDetails = ({ statue, index, account, characters, nextLv, flairLevel, flairMulti }) => {
  const { name, level = 0, bonus = 0, talentMulti = 1, progress = 0, effect } = statue ?? {};
  return <Stack gap={1}>
    <Box>
      <Typography variant={'cardTitle'} component={'div'}>{statueName(name)}</Typography>
      <Typography variant={'body2'} color={'text.secondary'}>{formatNum(level, 'level')}</Typography>
    </Box>
    {/* The base is level x bonus: the per character rows apply every multiplier, as the game's statue screen does, so
     their heading says so and the two never read as one sum */}
    <ItemCard.Section label={statueBonusName(effect)}>
      <ItemCard.Facts rows={[
        ['Base', statueSentence(effect, level * bonus)],
        ['Voodoo Statufication', formatNum(talentMulti, 'mult')]
      ]}/>
    </ItemCard.Section>
    {characters?.length ? <ItemCard.Section label={'Per character, all multipliers'}>
      <ItemCard.Facts rows={characters.map(({ name: characterName, flatTalents }) => [characterName,
        formatNum(Math.floor(10 * getStatueBonus(account, index, flatTalents)) / 10, 'amount', { precise: true })])}/>
    </ItemCard.Section> : null}
    <ItemCard.Section label={'Next level'}>
      <ItemCard.Facts rows={[
        ['Progress', `${formatGame(progress, 'Big', { whole: true })} / ${formatGame(nextLv, 'Big', { whole: true })}`],
        isSectionFailed(account, 'royalGuardian') ? ['Statue Flair', '-']
          : flairMulti > 1 ? [`Statue Flair ${flairLevel}`, `${formatNum(flairMulti, 'mult')} statue EXP`] : null
      ]}/>
    </ItemCard.Section>
  </Stack>;
};

const Statues = ({ characters, account }) => <Box sx={{ p: 1.5 }}>
  <CardGrid size={'icon'} fill>
    {(account?.statues ?? []).map((statue, index) => {
      const level = statue?.level ?? 0;
      const nextLv = Math.round(Math.pow(level, 1.17) * Math.pow(1.35, level / 10) + 1);
      const flairLevel = getStatueFlairLevel(account, index);
      // The game draws the flair banner as a font glyph; the pngs are crops of it (public/etc): the statue's mark
      return <IconTile key={`${statue?.name}-${index}`} icon={`data/${statue?.rawName}.png`} alt={statueName(statue?.name)}
                       value={formatNum(level)} status={level ? undefined : 'missing'}
                       mark={flairLevel ? `etc/StatueFlair${flairLevel}.png` : undefined} markAlt={`Statue Flair ${flairLevel}`}
                       details={statueDetails({
                         statue, index, account, characters, nextLv, flairLevel,
                         flairMulti: getStatueFlairExpMulti(account, index)
                       })}/>;
    })}
  </CardGrid>
</Box>;

export default Statues;
