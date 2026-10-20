import { Typography } from '@mui/material';
import { IconCheck, IconLock } from '@tabler/icons-react';
import { commaNotation, commaOrBig, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';

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

export const formatLumi = (value) => commaOrBig(value, Math.floor);

const STATUS = {
  claimable: { label: 'Claimable', color: 'success.main', Icon: IconCheck },
  owned: { label: 'Owned', color: 'success.main', Icon: IconCheck },
  locked: { label: 'Locked', color: 'text.secondary', Icon: IconLock }
};

// One status word with its icon, colored by its status role (same caption pattern as Minehead Opponents)
export const StatusText = ({ status }) => {
  const { label, color, Icon } = STATUS[status] ?? {};
  if (!label) return null;
  return <Typography variant={'caption'} component={'span'} color={color}
                     sx={{ display: 'inline-flex', alignItems: 'center', gap: .5 }}>
    <Icon size={14} stroke={2}/>
    {label}
  </Typography>;
};

// Menagerie doublers (and Black Stars, Organic Labels, Omnijade) as "placed / owned", shown on every page they are
// spent on. Hidden until the account owns one.
export const DoublerUsageCard = ({ title, doubler, icon, iconSize = 20 }) => {
  const owned = doubler?.owned ?? 0;
  if (!(owned > 0)) return null;
  const used = owned - Math.max(0, doubler?.left ?? 0);
  return <CardTitleAndValue title={title} icon={icon} imgStyle={{ width: iconSize, height: iconSize }}
                            value={`${commaNotation(used)} / ${commaNotation(owned)}`}/>;
};

// A hidden unlock or boost shows the Lumi Rank it appears at, like the game's "Lumi Rank N Required"
export const RankRequired = ({ rank }) => <Typography variant={'body2'} color={'text.secondary'}>
  Lumi Rank {commaNotation(rank ?? 0)} required
</Typography>;

// Level-row tag: "x2 Doubler" once a Menagerie doubler sits on the upgrade, "Doubler eligible" when one could.
// Eligibility only shows once the account owns a doubler of that kind, like DoublerUsageCard.
export const DoublerTag = ({ kind, doubled, eligible, owned }) => {
  if (!doubled && !(eligible && owned > 0)) return null;
  return <Typography variant={'caption'} color={doubled ? 'secondary' : 'text.secondary'}
                     sx={{ display: 'inline-flex', alignItems: 'center', gap: .5 }}>
    <img src={`${prefix}${DOUBLER_ICONS[kind]}`} alt={''} style={{ width: 16, height: 16, objectFit: 'contain' }}/>
    {doubled ? 'x2 Doubler' : 'Doubler eligible'}
  </Typography>;
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
