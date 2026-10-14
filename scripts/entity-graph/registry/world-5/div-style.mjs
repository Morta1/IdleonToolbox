// UPKEEP: Divinity("StyleLvReq") (Divinity.js:6-7): the Divinity level a style needs, by table position.
const levelFor = (t) => Math.round(5 * t + 5 * Math.floor(t / 4) + 10 * Math.floor(t / 5) + Math.max(0, 15 * (t - 5)));

export default {
  kind: 'divstyle',
  section: 'divStyles',
  key: (entry, index) => `DivStyle${index}`,
  // UPKEEP: the style art is etc/Div_Style_<position>.png, and Kinesis (0) is the tile.
  icon: (entry, index) => `/etc/Div_Style_${index}.png`,
  fallbackIcon: '/etc/Div_Style_0.png',
  fields: (entry, index) => (levelFor(index) > 0 ? [{ label: 'Divinity level needed', value: levelFor(index) }] : [])
};
