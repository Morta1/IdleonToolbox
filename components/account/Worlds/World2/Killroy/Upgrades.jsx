import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// Faster Respawn has no name of its own: its description is its title. The art is wide, so it takes the 56 px box.
const Upgrades = ({ killroy }) => <CardGrid size={'m'}>
  {(killroy?.upgrades ?? []).map(({ level, description, upgrade }, index) => <ItemCard key={`upgrade-${index}`}
                                                                                    icon={`etc/Killroy_${index}.png`}
                                                                                    iconSize={56}
                                                                                    title={upgrade ?? description}
                                                                                    level={{ value: level ?? 0 }}>
    {upgrade ? <ItemCard.Desc text={description}/> : null}
  </ItemCard>)}
</CardGrid>;

export default Upgrades;
