import { cleanUnderscore, formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';

// The Death Note mobs; a failed section's are the catalog at zero, with no grey and no note
const Monsters = ({ killroy, sectionFailed }) => <CardGrid size={'icon'}>
  {(killroy?.list ?? []).map(({ rawName, name, world, killRoyKills, icon }) => {
    const kills = Number(killRoyKills) || 0;
    const monster = cleanUnderscore(name ?? rawName);
    return <IconTile key={rawName} icon={`data/${icon}.png`} alt={monster} value={formatNum(kills)}
                     status={sectionFailed || kills ? undefined : 'missing'}
                     details={sectionFailed ? undefined
                       : `${monster} (World ${(world ?? 0) + 1}): ${formatNum(kills)} ${kills === 1 ? 'kill' : 'kills'}`}/>;
  })}
</CardGrid>;

export default Monsters;
