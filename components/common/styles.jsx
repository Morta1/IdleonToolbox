import React, { forwardRef, useContext, useEffect } from 'react';
import { cleanUnderscore, formatNum, growth, prefix, talentText, titleCaseName } from 'utility/helpers';
import { Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Notice from '@components/common/Notice';
import { AppContext } from '@components/common/context/AppProvider';
import GameIcon from '@components/common/GameIcon';
import { NoteTrigger } from '@components/common/InfoButton';
import ItemCard from '@components/common/cards/ItemCard';
import { trackEvent } from '@utility/analytics';
import { calcCardBonus } from 'parsers/cardMath';
import { formatGame } from '@utility/gameNotation';

// A sprite over its count. size is a GameIcon size; a title is the thing's name, a note that opens on a tap. A title
// that is more than a name (a note with lines) takes label as the thing's name.
export const IconWithText = forwardRef((props, ref) => {
  const { stat, icon, size = 32, title = '', label, ...rest } = props
  const name = typeof title === 'string' ? title : label ?? '';
  const body = <Stack alignItems={'center'} {...rest} ref={ref} style={{ position: 'relative', width: 'fit-content' }}>
    <GameIcon src={`data/${icon}.png`} size={size} alt={name}/>
    <Typography variant={'body2'} component={'span'}>{stat}</Typography>
  </Stack>;
  return title ? <NoteTrigger note={title} label={name || undefined}>{body}</NoteTrigger> : body;
})
IconWithText.displayName = 'IconWithText'

// A card is 56x72, not a square item box, so its art keeps its own box (5a Decision 1), dimmed when not owned.
// Its details open on a tap.
export const CardAndBorder = (cardProps) => {
  const { cardName, displayName, stars, cardIndex, name, variant, rawName, amount, nextLevelReq, forceDisable } = cardProps;
  const iconSrc = variant === 'cardSet' ? `${prefix}data/${rawName}.png` : `${prefix}data/2Cards${cardIndex}.png`;
  const realCardName = variant === 'cardSet' ? name : cardName;
  const label = cleanUnderscore(displayName ?? realCardName ?? rawName ?? '');
  // A card the save never mentions (a failed cards section) is unknown, not missing: only a 0 dims it
  const dim = (amount === 0 && variant !== 'cardSet') || forceDisable;
  const art = <img src={iconSrc} alt={label} style={{ width: 56, height: 72, objectFit: 'contain', opacity: dim ? .5 : 1 }}/>;
  const details = <CardTooltip {...{ ...cardProps, cardName: realCardName, nextLevelReq, amount }}/>;

  return <>
    <NoteTrigger note={details} label={label}>{art}</NoteTrigger>
    {/* After the art, so the equipped border draws over it */}
    {stars > 0 && !forceDisable ?
      <BorderIcon src={`${prefix}data/CardEquipBorder${stars}.png`} alt=""/> : null}
  </>
}

// A card set has no displayName: its note is titled by the set's name (cardName), as its trigger is.
const cardCount = (value) => formatGame(value, 'RunCodeOfTypeXforThingY.CardsTillNextLV', { whole: true });
const CardTooltip = ({ displayName, cardName, effect, bonus, stars, showInfo, nextLevelReq, amount }) => {
  let realBonus = bonus;
  if (showInfo) {
    realBonus = calcCardBonus({ bonus, stars });
  }
  return <>
    <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(displayName ?? cardName ?? '')}</Typography>
    <Typography variant={'body2'}>{cleanUnderscore(effect?.replace('{', formatNum(realBonus)) ?? '')}</Typography>
    {showInfo ? <Stack mt={1} direction={'row'} gap={1} flexWrap={'wrap'}>
      {[1, 2, 3, 4, 5, 6, 7].map((_, index) => {
        return <Stack key={`${displayName}-${index}`} alignItems={'center'} justifyContent={'space-between'}>
          {index === 0 ? <Typography variant={'body2'}>Base</Typography> :
            <GameIcon src={`etc/Star${index}.png`} size={16} alt={`${index} star`}/>}
          <Typography variant={'body2'}>{formatNum(bonus * (index + 1))}</Typography>
        </Stack>
      })}
    </Stack> : null}
    {/* The game's line (N.js): commas up to 1M, its short form past it. Not CardsTillNextLV's 100M: that rule is its "more cards to Lv Up" */}
    {amount >= nextLevelReq ? <Typography variant={'body2'}>You've collected {formatNum(amount, 'whole')} cards</Typography> : nextLevelReq > 0 ?
      <ItemCard.Facts rows={[['Progress', `${cardCount(amount)} / ${cardCount(nextLevelReq)}`]]}/> : null}
  </>
}

const BorderIcon = styled('img')`
  position: absolute;
  left: 50%;
  top: -3px;
  pointer-events: none;
  transform: translateX(-50%);
`


export const TalentTooltip = ({ level, funcX, x1, x2, funcY, y1, y2, description, name, talentId }) => {
  const mainStat = level > 0 ? growth(funcX, level, x1, x2) : 0;
  const secondaryStat = level > 0 ? growth(funcY, level, y1, y2) : 0;
  return <>
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      <GameIcon src={`data/UISkillIcon${talentId}.png`} size={32} alt=""/>
      <Typography variant={'cardTitle'} component={'div'} color={'text.primary'}>{titleCaseName(cleanUnderscore(name))}</Typography>
    </Stack>
    <Typography variant={'body2'}>{talentText(description, mainStat, secondaryStat)}</Typography>
  </>
}

export const PlayersList = ({ players, characters }) => {
  return <Stack gap={1} direction={'row'}>
    {players.map(({ index }) => {
      const name = cleanUnderscore(characters?.[index]?.name) || 'Character';
      return <NoteTrigger key={`player-${index}`} note={name} label={name}>
        <GameIcon src={`data/ClassIcons${characters?.[index]?.classIndex}.png`} size={24} alt=""/>
      </NoteTrigger>;
    })}
  </Stack>
}

// A section that throws in the parser comes back as its fallback (often {}), so only
// account.failedSections tells a parse error apart from a save that has no data yet.
// '*' is set when the whole parse failed.
export const isSectionFailed = (account, section) => {
  const failed = account?.failedSections;
  return !!failed?.includes(section) || !!failed?.includes('*');
};

// The whole parse failed: a failed section comes back as its catalog at zero (parsers/index.ts), and here none did.
export const isParseFailed = (account) => !!account?.failedSections?.includes('*');

// A number a parser builds from these sections: when one failed it reads "-".
export const fedBy = (account, ...sections) => sections.some((name) => isSectionFailed(account, name));

// "your Hat Rack", but a name that carries its own word stands alone: "the Hole", "The Button", "your save".
const yourName = (name) => (/^(the|your)\b/i.test(name) ? name : `your ${name}`);

// The parse's own section keys as a player reads them: "printer" is "Printer", "cooking.kitchens" "Cooking kitchens".
const sectionName = (key) => {
  const words = `${key}`.replace(/\./g, ' ').replace(/([a-z])([A-Z])/g, (_, a, b) => `${a} ${b}`).toLowerCase();
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};
export const joinNames = (names) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);
// What a page that reads many sections says failed: '*' (the whole parse) is "your save", else every one by name.
const failedSectionsName = (sections) => (sections.includes('*') ? 'your save' : joinNames(sections.map(sectionName)));

// A page's first note when its section is missing or failed to parse (Notices board, "Never replace the page"): the
// page renders under it. sections: the parse's failed keys, for a page that reads too many to name itself (failed is
// then implied). atZero: the page keeps its catalog at zero under the note, so the note says so (Notices board, "Nothing
// of yours"); a page whose body went blank has no zeros to explain.
export const MissingData = ({ name, failed, sections, atZero }) => {
  const shownName = sections ? failedSectionsName(sections) : name;
  const isFailed = failed || Boolean(sections);
  useEffect(() => {
    // Parse errors only reach the console otherwise; this surfaces breaks nobody reports.
    if (isFailed) trackEvent('section_failed', { section: shownName });
  }, [isFailed, shownName]);

  // The name leads (or stands alone): some names carry their own article ("The Button").
  return isFailed
    ? <Notice tone={'error'} sx={{ mb: 2 }}>{atZero
      ? `Couldn't load ${yourName(shownName)}, so everything shows at zero. That's a bug on my end.`
      : `Couldn't load ${shownName}. That's a bug on my end.`}</Notice>
    : <Notice tone={'missing'} sx={{ mb: 2 }}>{`${shownName} has no data in your save yet: it shows up here once it does.`}</Notice>;
};

// A page's first note for the sections it reads directly: names ({ key: name }, first first) says what to call the first
// failed one, and a whole-parse failure reads "your save". With no names, a page of composites that read nearly every
// section: any failed one counts, and the note names them all.
export const MissingSections = ({ account, names }) => {
  const failed = account?.failedSections;
  if (!names) return failed?.length ? <MissingData sections={failed}/> : null;
  const first = failed?.includes('*') ? 'your save' : names?.[Object.keys(names ?? {}).find((key) => failed?.includes(key))];
  return first ? <MissingData name={first} failed/> : null;
};

// A save that hasn't got to this page: its catalog reads zero under this. reached is something the save can only have
// once there. A guest has no save to say it of, and their band already says why the numbers are zero.
export const NotReached = ({ name, reached, children }) => {
  const { state } = useContext(AppContext);
  if (reached || state?.emptyAccount) return null;
  return <Notice tone={'locked'} sx={{ mb: 2 }}>Your account hasn&apos;t reached {name} yet.{children ? <> {children}</> : null}</Notice>;
};

export const CenteredStack = ({ direction = 'row', children }) => {
  return <Stack gap={1} direction={direction} alignItems={'center'}>
    {children}
  </Stack>
}


