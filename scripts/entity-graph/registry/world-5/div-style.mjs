import { gameTable } from '../data.mjs';

// The divinityStyleLevelReq table (Divinity StyleLvReq): the Divinity level a style needs, by table position.
const levelFor = (t, data) => {
  const req = gameTable(data, 'divinityStyleLevelReq');
  return req
    ? Math.round(req.perStyle * t + req.stepA * Math.floor(t / req.everyA) + req.stepB * Math.floor(t / req.everyB) + Math.max(0, req.lateRate * (t - req.lateFrom)))
    : null;
};

export default {
  kind: 'divstyle',
  section: 'divStyles',
  key: (entry, index) => `DivStyle${index}`,
  // UPKEEP: the style art is etc/Div_Style_<position>.png, and Kinesis (0) is the tile.
  icon: (entry, index) => `/etc/Div_Style_${index}.png`,
  fallbackIcon: '/etc/Div_Style_0.png',
  fields: (entry, index, data) => {
    const level = levelFor(index, data);
    return level > 0 ? [{ label: 'Divinity level needed', value: level }] : [];
  }
};
