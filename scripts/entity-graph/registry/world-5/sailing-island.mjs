import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { linked } from '../../../../utility/wiki/field-links.mjs';
import { artifactIslands } from '../../nodes/catalogs-b.mjs';
import { spaced } from '../text.mjs';

export default {
  kind: 'sailingisland',
  section: 'islands',
  // UPKEEP: keyed by table position, the Boats[n][1] destination index; SailProg<i> follows it.
  key: (entry, index) => `SailIsland${index}`,
  icon: (entry, index) => `/data/SailProg${index}.png`,
  fallbackIcon: '/data/ClassIcons54.png',
  // UPKEEP: island names are hand-kept in z-processing (features/world-5/sailing.js) because N.js has "Sahara" on every row; the artifact join matches on the name, so a rename silently drops the artifact list.
  fields: (entry, index, data) => {
    const owners = artifactIslands(data.artifacts, data.islands);
    const here = (data.artifacts || []).map((artifact, i) => ({ artifact, i })).filter(({ i }) => owners[i] === entry.name);
    const found = here.map(({ artifact }) => spaced(artifact.name));
    return [
      { label: 'Distance', value: `${formatAmount(entry.distance)} m` },
      { label: 'Captain EXP per trip (base)', value: entry.expPerTrip },
      ...(found.length ? [linked({ label: 'Artifacts found here', value: found }, 'hosts', ...here.map(({ i }) => `artifact:Arti${i}`))] : [])
    ];
  }
};
