import { cleanUnderscore, formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// A locked upgrade waits on the page's next upgrade (the meat made unlocks the next type), so it carries no cost
const Upgrades = ({ upgrades, failed, meatSlices }) => <CardGrid size={'m'}>
  {(upgrades ?? []).map(({ name, description, level, cost, unlocked }, index) => <ItemCard key={index}
                                                                                         icon={`etc/Bubbo_Upgrade_${index}.png`}
                                                                                         title={cleanUnderscore(name)}
                                                                                         meta={failed ? undefined : formatNum(level ?? 0, 'level')}
                                                                                         status={failed || unlocked ? undefined : 'locked'}
                                                                                         footer={failed || !unlocked ? null
                                                                                           : <ItemCard.Cost icon={'etc/Bubba_0.png'} iconAlt={'Meat slices'}
                                                                                                            need={cost} have={meatSlices}
                                                                                                            game={'Bubbastuff.UpgCost'}/>}>
    <ItemCard.Desc text={cleanUnderscore(description ?? '').split('\n')}/>
  </ItemCard>)}
</CardGrid>;

export default Upgrades;
