import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The Tar Pit opens 3 upgrades with Megafish 1, 3 more with Megafish 5 and the last 2 with Megafish 8
const TAR_MEGAFISH = (index) => (index < 3 ? 1 : index < 6 ? 5 : 8);

const Upgrades = ({ upgrades, isTar, failed, fish, tarFish }) => <CardGrid size={'m'}>
  {(upgrades ?? []).map(({ name, desc, level, cost, unlocked, x3 }, index) => <ItemCard key={index}
                                                                                      icon={`etc/KUpg${isTar ? 'b' : 'a'}_${index}.png`}
                                                                                      title={cleanUnderscore(name)}
                                                                                      meta={failed ? undefined : formatNum(level ?? 0, 'level')}
                                                                                      status={failed || unlocked !== false ? undefined : 'locked'}
                                                                                      footer={failed ? null : unlocked === false
                                                                                        ? <ItemCard.Facts rows={[['Unlocks', isTar
                                                                                          ? `with Megafish ${TAR_MEGAFISH(index)}`
                                                                                          : `at ${formatGame(Number(x3), 'Summoning.RooNextUpgReq')} fish caught`]]}/>
                                                                                        : <ItemCard.Cost icon={`etc/K${isTar ? 'Tar' : 'Fish'}.png`}
                                                                                                         iconAlt={isTar ? 'Tar fish' : 'Fish'}
                                                                                                         need={cost} have={isTar ? tarFish : fish}
                                                                                                         {...(isTar
                                                                                                           ? { game: 'Summoning.RooCost_T' }
                                                                                                           // A fish cost has no gameNotation key
                                                                                                           : { format: (value) => formatNum(value) })}/>}>
    <ItemCard.Desc text={cleanUnderscore(desc)}/>
  </ItemCard>)}
</CardGrid>;

export default Upgrades;
