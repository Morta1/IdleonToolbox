import { Box, Tooltip, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import StatTile from '@components/common/cards/StatTile';
import GameIcon from '@components/common/GameIcon';

// Lumi's art: font 650's currency glyph, extracted by z-processing into public/etc.
export const LUMI_ICON = 'etc/Lumi.png';
export const SHELL_ICON = 'data/MenaShell1.png';
// Glyphs the game draws beside each doubler's left count, extracted by z-processing into public/etc
export const DOUBLER_ICONS = {
  blackStars: 'etc/BlackStar.png',
  organicLabels: 'etc/OrganicLabel.png',
  minehead: 'etc/MineheadDoubler.png',
  sushi: 'etc/SushiDoubler.png',
  jellyOperator: 'etc/JellyOpDoubler.png',
  omnijade: 'etc/Omnijade.png'
};

// Lumi as the game prints it in its costs (MenagerieStuff.Cost): commas up to 1e9, Big past it, so the balance, every
// cost and Levels ahead read alike.
export const formatLumi = (value) => formatGame(Math.floor(value ?? 0), 'MenagerieStuff.Cost', { whole: true });

// Menagerie doublers (and Black Stars, Organic Labels, Omnijade) as "placed / owned", on every page they are spent on.
// Hidden until the account owns one. A StatTile, so it sits in a Summary or a tab's row like any other number.
export const DoublerUsageCard = ({ title, doubler, icon }) => {
  const owned = doubler?.owned ?? 0;
  if (!(owned > 0)) return null;
  const used = owned - Math.max(0, doubler?.left ?? 0);
  // Doublers are the Menagerie's, whichever page's Summary this sits in
  return <StatTile label={title} icon={icon} value={`${formatNum(used)} / ${formatNum(owned)}`} failed={false}/>;
};

// A hidden unlock or boost shows the Lumi Rank it appears at, like the game's "Lumi Rank N Required"
export const RankRequired = ({ rank }) => <Typography variant={'body2'} color={'text.secondary'}>
  Lumi Rank {formatNum(rank ?? 0)} required
</Typography>;

// Level-row tag: "x2 Doubler" once a Menagerie doubler sits on the upgrade, "Doubler eligible" when one could.
// Eligibility only shows once the account owns a doubler of that kind, like DoublerUsageCard.
// The doubler's icon alone, its words in the tooltip: full on a doubled upgrade, faded on one a doubler could go on
export const DoublerTag = ({ kind, doubled, eligible, owned }) => {
  if (!doubled && !(eligible && owned > 0)) return null;
  const label = doubled ? 'x2 Doubler' : 'Doubler eligible';
  return <Tooltip title={label}>
    <Box component={'span'} sx={{ display: 'inline-flex', opacity: doubled ? 1 : 0.4 }}>
      <GameIcon src={DOUBLER_ICONS[kind]} size={20} alt={label}/>
    </Box>
  </Tooltip>;
};

// Numbers as the descriptions print them: "+1,228", "36.90x", "6.5e25", "25.3Q", "+76,000%"
const NUMBER_TOKEN = /[+-]?\d[\d,]*(?:\.\d+)?(?:e[+-]?\d+)?(?:[%x]|[KMBTQ]{1,3}(?![a-z]))?/g;

// The numbers that change when a doubler sits on the upgrade; empty when the two texts don't line up
export const getDoubledChanges = (description, doubledDescription) => {
  const current = String(description ?? '').match(NUMBER_TOKEN) ?? [];
  const doubled = String(doubledDescription ?? '').match(NUMBER_TOKEN) ?? [];
  if (current.length !== doubled.length) return [];
  return doubled.filter((token, index) => token !== current[index]);
};

// "Doubled: +76,000%" under the description (parser leaves doubledDescription null when not applicable)
export const DoubledPreview = ({ description, doubledDescription, owned }) => {
  if (!(owned > 0) || !doubledDescription) return null;
  const changes = getDoubledChanges(description, doubledDescription);
  if (!changes.length) return null;
  return <Typography variant={'body2'} color={'secondary'}>
    Doubled: {changes.join(' · ')}
  </Typography>;
};
