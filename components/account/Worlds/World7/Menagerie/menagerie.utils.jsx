import { Typography } from '@mui/material';
import { IconCheck, IconLock } from '@tabler/icons-react';
import { commaNotation, notateNumber } from '@utility/helpers';
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
  // The Jelly Operator panel prints its count without a glyph; its Menagerie boost icon stands in
  jellyOperator: 'data/MenaIconP12.png',
  omnijade: 'etc/Omnijade.png'
};

export const formatLumi = (value) => 1e6 > value ? commaNotation(Math.floor(value)) : notateNumber(value, 'Big');

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
