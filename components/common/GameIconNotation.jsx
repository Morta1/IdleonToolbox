import { Typography } from '@mui/material';
import styled from '@emotion/styled';
import processString from 'react-process-string';
import { prefix } from 'utility/helpers';

// Game uses different fonts per damage tier (PLAYERINFO.js line 64):
//   Font 33  (green)  — damage < 9,999,999 (no icons, plain numbers)
//   Font 251 (yellow) — damage < 9,999,999,999,999 ([ icon)
//   Font 244 (purple) — damage < 1e19 (! icon)
//   Font 108 (blue)   — damage >= 1e19 (| and 棘 icons)
//
// Each symbol only appears in one tier:
//   [ (charcode 91)    → font-251_91.png    → Damage_M.png (yellow M)
//   ! (charcode 33)    → font-244_33.png    → Damage_T.png (purple T)
//   | (charcode 124)   → font-108_124.png   → Damage_D.png (blue diamond)
//   棘 (charcode 26840) → font-108_26840.png → Damage_S.png (blue spike)

const tiers = [
  { symbol: '棘', icon: 'S', color: '#5fc5e8' },  // font 108 — blue
  { symbol: '|', icon: 'D', color: '#5fc5e8' },   // font 108 — blue
  { symbol: '!', icon: 'T', color: '#cd6cf5' },   // font 244 — purple
  { symbol: '[', icon: 'M', color: '#f5d76e' },   // font 251 — yellow
];

const getTier = (str) => {
  for (const tier of tiers) {
    if (str.includes(tier.symbol)) return tier;
  }
  return null;
};

const GameIconNotation = ({ value, sx }) => {
  const tier = getTier(Array.isArray(value) ? value[0] : value);
  const color = tier?.color ?? '#fffcc9';

  return (
    <Typography component={'span'} sx={{ display: 'flex', alignItems: 'center', gap: .5, color, ...sx }}>
      {processString([{
        regex: /[\[!|棘]/g,
        fn: (key, match) => {
          const modifier = match.at(0);
          const matched = tiers.find((t) => t.symbol === modifier);
          return <GameIcon key={key} src={`${prefix}etc/Damage_${matched.icon}.png`} alt=""/>;
        }
      }])(value)}
    </Typography>
  );
};

const GameIcon = styled.img`
  width: 16px;
  height: 16px;
  object-fit: contain;
`;

export default GameIconNotation;
export { GameIcon };
