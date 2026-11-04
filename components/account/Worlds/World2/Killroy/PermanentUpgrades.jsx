import { cleanUnderscore, formatNum } from '@utility/helpers';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { createBreakdown, info, listGroup } from '@parsers/breakdown';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The upgrade's short name: "Permanently boosts Crop Evolution Chance! ..." is Crop Evolution Chance. A flat unlock
// ("Adds 1 nugget to your Shovel ...") has none, so its description is its title.
const shortName = (text) => text.match(/boosts (?:the |your )?(.+?)(?:!| by |\.\.\.)/i)?.[1]?.capitalize();

// Below Lv 2 the Gallery upgrade's description is its +1 Grade chance, which names no upgrade: its name is the
// multiplier the game's description names from Lv 2
const GALLERY = 5;
const GALLERY_NAME = 'Gallery Multiplier';

// The game's fills of the shop's descriptions (N.js, the skull shop): Artifact Find Chance, Crop Evolution Chance and
// Jade Gain round down, Masterclass drops to the Mystery bonus round up, the Gallery floors its whole percent. Each
// card's progress pair fills the same way, so it reads as its description. The caps are KillroyBonuses' limits (the
// parser's capDisplay floors 2.3 to 2.29)
const SHOP_FILLS = {
  1: { round: Math.floor, cap: 2, unit: 'x' },
  3: { round: Math.floor, cap: 10, unit: 'x' },
  4: { round: Math.floor, cap: 3, unit: 'x' },
  [GALLERY]: { round: Math.floor, cap: 10, unit: 'x', hundredths: true },
  6: { round: Math.ceil, cap: 2.3, unit: 'x' },
  7: { round: Math.ceil, cap: 1.8, unit: 'x' },
  8: { round: Math.ceil, cap: 25, unit: '%', sign: '+' },
  9: { round: Math.ceil, cap: 3, unit: 'x' }
};
const fillText = (value, { round, unit, hundredths, sign = '' }) => (hundredths
  ? `+${Math.floor(value) / 100}${unit}`
  : `${sign}${round(100 * value) / 100}${unit}`);

// The parser prints an applied multiplier as "x1.0117": the page reads it in the card's mult kind ("1.01x"). A percent
// ("+1.04%") already reads as one
const appliedText = (text) => (String(text ?? '').startsWith('x')
  ? formatNum(Number(String(text).slice(1)), 'mult')
  : text);

const breakpointText = ({ level, bonusDisplay }) => `${formatNum(level, 'level')} (${bonusDisplay})`;

// The cap is never fully reached: the breakpoints are the levels for 50% to 99% of it, listed in a drawer named as the
// Fact that opens it and headed with the next one
const breakpointsTrigger = (title, nextBreakpoint, breakpoints) => {
  const nextText = breakpointText(nextBreakpoint);
  const drawer = `${title} next breakpoint`;
  const rows = (breakpoints ?? []).map((breakpoint) => info(`${breakpoint.percent}% of the cap`, breakpoint.level,
    { formatted: breakpointText(breakpoint) }));
  return <Breakdown asValue data={createBreakdown(drawer, nextText, [listGroup('Breakpoints', rows)], { combine: 'list' })}
                    title={drawer} countNoun={'breakpoints'}>
    {nextText}
  </Breakdown>;
};

const PermanentUpgrades = ({ killroy, sectionFailed }) => <CardGrid size={'m'}>
  {(killroy?.permanentUpgrades ?? []).map(({
                                            description,
                                            level,
                                            bonus,
                                            progress,
                                            bonusDisplay,
                                            capDisplay,
                                            breakpoints,
                                            nextBreakpoint,
                                            appliedBonuses
                                          }, index) => {
    const text = cleanUnderscore(description ?? '');
    const name = index === GALLERY ? GALLERY_NAME : shortName(text);
    const title = name ?? text.capitalize();
    const fill = SHOP_FILLS[index];
    const valueText = fill && Number.isFinite(bonus) ? fillText(bonus, fill) : bonusDisplay;
    const capText = fill ? fillText(fill.cap, fill) : capDisplay;
    // A failed section's shop is the catalog at zero: no progress, breakpoint or applied bonus of its own
    const rows = sectionFailed ? [] : [
      nextBreakpoint ? ['Next breakpoint', breakpointsTrigger(title, nextBreakpoint, breakpoints)] : null,
      ...(appliedBonuses ?? []).map(({ name: applied, value, max }) => [`Applied to ${applied}`,
        `${appliedText(value)} (max ${appliedText(max)})`])
    ];
    return <ItemCard key={`upgrade-${index}`} icon={`etc/Skull_Shop_Item_${index}.png`} title={title}
                     level={level > 0 ? { value: level } : undefined}>
      {name ? <ItemCard.Desc text={text}/> : null}
      {!sectionFailed && progress != null
        ? <ItemCard.Progress label={'Toward its cap'} value={valueText} max={capText} percent={progress}/>
        : null}
      <ItemCard.Facts rows={rows}/>
    </ItemCard>;
  })}
</CardGrid>;

export default PermanentUpgrades;
