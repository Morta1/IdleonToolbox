import { cleanUnderscore, formatDuration, secondsToShortDuration } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { SMOKER_MAX_QUALITY_SECONDS, SMOKER_UPGRADE } from '@parsers/clickers/bubba';

const upgradeStatus = ({ unlocked, maxed }) => (!unlocked ? 'locked' : maxed ? 'maxed' : undefined);

// The game's own Smoker line ("smoking for ~") runs a live clock, so the card states it at the save's time
const smokerFacts = (smokerSeconds) => <ItemCard.Facts rows={[
  ['Smoking for', secondsToShortDuration(smokerSeconds)],
  ['Max quality in', formatDuration(SMOKER_MAX_QUALITY_SECONDS - smokerSeconds)]
]}/>;

// The level is the game's (bought plus prestige levels); the cap and the cost read the bought ones. A locked upgrade waits
// on the page's next upgrade (the meat made unlocks the next type), so it carries no cost, nor does a maxed one.
const Upgrades = ({ upgrades, failed, meatSlices, smokerSeconds = 0 }) => <CardGrid size={'m'}>
  {(upgrades ?? []).map((upgrade, index) => {
    const { name, description, realLV, maxLevel, cost, unlocked } = upgrade;
    const status = failed ? undefined : upgradeStatus(upgrade);
    return <ItemCard key={index}
                     icon={`etc/Bubbo_Upgrade_${index}.png`}
                     title={cleanUnderscore(name)}
                     level={failed ? undefined : { value: realLV ?? 0, max: maxLevel ?? undefined }}
                     status={status}
                     footer={failed || status ? null
                       : <ItemCard.Cost icon={'etc/Bubba_0.png'} iconAlt={'Meat slices'}
                                        need={cost} have={meatSlices}
                                        game={'Bubbastuff.UpgCost'}/>}>
      <ItemCard.Desc text={cleanUnderscore(description ?? '').split('\n')}/>
      {!failed && unlocked && index === SMOKER_UPGRADE ? smokerFacts(smokerSeconds) : null}
    </ItemCard>;
  })}
</CardGrid>;

export default Upgrades;
