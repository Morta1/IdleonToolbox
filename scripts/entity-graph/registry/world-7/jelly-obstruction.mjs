import { formatAmount } from '../../../../utility/wiki/effects.mjs';

// The bonus panel fills `{` with round(value) and `}` with MultiplierInfo(1 + value / 100) (N.js:122505); the wiki rounds the
// multiplier to two decimals as the opponent pages do.
const multiplierOf = (value) => Math.round((1 + value / 100) * 100) / 100;
const filled = ({ bonus, value }) => bonus
  .split('{').join(formatAmount(Math.round(value)))
  .split('}').join(multiplierOf(value).toLocaleString('en-US', { maximumFractionDigits: 2 }));

export default {
  kind: 'jellyobstruction',
  // UPKEEP: research[45] names the obstruction by operation, [46] is its Operational bonus text and [47] the value (N.js:122505,
  // RoG_BonusQTY, JellyOperation.js:81); clearing operation t earns it.
  section: (data) => data.research[45].map((name, t) => ({
    name,
    bonus: data.research[46][t],
    value: Number(data.research[47][t])
  })),
  key: (entry, index) => `JellyObstruction${index}`,
  icon: (entry, index) => `/data/JellyOp${index}.png`,
  fallbackIcon: '/data/JellyOp0.png',
  // UPKEEP: the unreleased operations read "Nothing_yet...".
  skip: (entry) => (/^Nothing/.test(entry.bonus) ? 'placeholder: no bonus yet' : false),
  describe: filled,
  fields: (entry, index) => [{ label: 'Operation', value: index + 1 }]
};
