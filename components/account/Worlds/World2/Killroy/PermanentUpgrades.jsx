import { cleanUnderscore, formatNum } from '@utility/helpers';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { createBreakdown, info, listGroup } from '@parsers/breakdown';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The upgrade's short name: "Permanently boosts Crop Evolution Chance! ..." is Crop Evolution Chance. A flat unlock
// ("Adds 1 nugget to your Shovel ...") has none, so its description is its title.
const shortName = (text) => text.match(/boosts (?:the |your )?(.+?)(?:!| by |\.\.\.)/i)?.[1]?.capitalize();

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
                                            progress,
                                            bonusDisplay,
                                            capDisplay,
                                            breakpoints,
                                            nextBreakpoint,
                                            appliedBonuses
                                          }, index) => {
    const text = cleanUnderscore(description ?? '');
    const name = shortName(text);
    const title = name ?? text.capitalize();
    // A failed section's shop is the catalog at zero: no progress, breakpoint or applied bonus of its own
    const rows = sectionFailed ? [] : [
      nextBreakpoint ? ['Next breakpoint', breakpointsTrigger(title, nextBreakpoint, breakpoints)] : null,
      // The game feeds these bonuses in as percentages: 1.42x applies as x1.0142
      ...(appliedBonuses ?? []).map(({ name: applied, value, max }) => [`Applied to ${applied}`, `${value} (max ${max})`])
    ];
    return <ItemCard key={`upgrade-${index}`} icon={`etc/Skull_Shop_Item_${index}.png`} title={title}
                     level={level > 0 ? { value: level } : undefined}>
      {name ? <ItemCard.Desc text={text}/> : null}
      {!sectionFailed && progress != null
        ? <ItemCard.Progress label={'Toward its cap'} value={bonusDisplay} max={capDisplay} percent={progress}/>
        : null}
      <ItemCard.Facts rows={rows}/>
    </ItemCard>;
  })}
</CardGrid>;

export default PermanentUpgrades;
