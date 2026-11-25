import React, { useState } from 'react';
import { Box, Button, Link, Stack, Typography } from '@mui/material';
import { IconArrowsMaximize } from '@tabler/icons-react';
import GameIcon from '@components/common/GameIcon';
import AppDialog from '@components/common/Overlays/AppDialog';
import { ON_MAP } from '@utility/colorSets';
import { PIN_HEIGHT, PIN_WIDTH, placePins } from '@utility/wiki/map-pins.mjs';
import { goOnPlainClick } from './links';

// The picture's most: short where there is room so the sections show under it, the whole width on a phone.
const DESKTOP = { width: 644, height: 300 };
const PHONE = { width: 352, height: 400 };
// The room the panel gives it, not the window's: beside an ad a 900 px window leaves 260. Below it, the phone's form.
const ROOM = { map: 480, island: 600 };
// A world's island keeps its own size.
const ISLAND = { width: 811, height: 433 };
// A phone's enlarged map: at least this large, scrolled sideways, with its key under it.
const LARGE = { width: 384, height: 480 };

const fit = ({ width, height }, most) => Math.min(most.width / width, most.height / height, 1);

// The number before a row, right-aligned so names line up under each other. A row with no number keeps the room, and
// one with no icon the icon's height.
export const RowNumber = ({ number }) => <Typography
  component={'span'} variant={'caption'} color={'text.secondary'}
  sx={{ width: 18, flexShrink: 0, lineHeight: '24px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
>
  {number}
</Typography>;

const spotSx = { position: 'absolute', transform: 'translate(-50%, -50%)', boxSizing: 'border-box' };
const spotStyle = ([x, y], { width, height }) => ({ left: `${(x / width) * 100}%`, top: `${(y / height) * 100}%`, '--share': `${(x / width) * 100}%` });

const plateSx = {
  minWidth: PIN_HEIGHT, maxWidth: PIN_WIDTH, height: PIN_HEIGHT, px: 0.5, borderRadius: 0.5, bgcolor: ON_MAP.plate, color: ON_MAP.text,
  textAlign: 'center', fontSize: 12, fontWeight: 600, lineHeight: `${PIN_HEIGHT - 2}px`
};

// What a number is, over it while the mouse rests on it, leaning inwards near the picture's sides (--share). The rows under the picture say the same, so it is no one's only way.
const nameSx = (above) => ({
  '@media (hover: hover)': {
    '&:hover': { zIndex: 1 },
    '&:hover::after': {
      content: 'attr(data-name)', position: 'absolute', left: 'var(--share)', bottom: `calc(100% + ${above}px)`,
      transform: 'translateX(calc(-1 * var(--share)))',
      px: 1, py: 0.25, borderRadius: 0.5, bgcolor: ON_MAP.label, color: ON_MAP.text, fontSize: 12, fontWeight: 500, lineHeight: '20px',
      whiteSpace: 'nowrap', pointerEvents: 'none'
    }
  }
});
const nameOf = ({ name, note }) => (note ? `${name} · ${note}` : name);

// The numbers, placed beside their marks for a picture drawn at `scale` and given as shares of it, so they keep their
// marks at any size. A number opens its row's page; the links repeat the rows', so the keyboard skips them.
const Pins = ({ atlas, scale, small, onGo }) => {
  const go = goOnPlainClick(onGo);
  const spots = placePins(atlas.pins.map(({ box }) => box), atlas.width, atlas.height, scale);
  return atlas.pins.map(({ number, href, ...pin }, i) => <Box
    key={number} data-name={small ? undefined : nameOf(pin)}
    {...(href && !small ? { component: 'a', href, tabIndex: -1, onClick: (event) => go(event, href) } : { component: 'span' })}
    style={spotStyle(spots[i].map((n) => n / scale), atlas)}
    sx={{ ...spotSx, ...plateSx, ...(small ? {} : nameSx(4)), textDecoration: 'none', borderBottom: '2px solid', borderColor: ON_MAP.edge }}
  >
    {number}
  </Box>);
};

// The game's own buttons on an island, each leading to its map. A small island has no room for their numbers.
const BUTTONS = { area: { src: '/etc/Map_Area.png', width: 23, height: 18 }, town: { src: '/etc/Map_Town.png', width: 29, height: 24 } };
const Buttons = ({ atlas, small, onGo }) => {
  const go = goOnPlainClick(onGo);
  return atlas.pins.map(({ number, at, town, below, href, ...pin }) => {
    const { src, width, height } = town ? BUTTONS.town : BUTTONS.area;
    const image = <img src={src} alt={''} width={small ? width / 2 : width} height={small ? height / 2 : height} style={{ display: 'block' }}/>;
    if (small) return <Box key={number} component={'span'} style={spotStyle(at, atlas)} sx={spotSx}>{image}</Box>;
    return <Box key={number} component={'a'} href={href} tabIndex={-1} data-name={nameOf(pin)} onClick={(event) => go(event, href)} style={spotStyle(at, atlas)}
                sx={{ ...spotSx, ...nameSx(below ? 4 : PIN_HEIGHT + 4), textDecoration: 'none' }}>
      {image}
      <Box component={'span'} sx={{ ...plateSx, position: 'absolute', left: '50%', transform: 'translateX(-50%)', boxSizing: 'border-box', lineHeight: `${PIN_HEIGHT}px` }}
           style={below ? { top: '100%' } : { bottom: '100%' }}>
        {number}
      </Box>
    </Box>;
  });
};

const Marks = ({ atlas, ...props }) => (atlas.island ? <Buttons atlas={atlas} {...props}/> : <Pins atlas={atlas} {...props}/>);

const Picture = ({ atlas, name }) => <Box
  component={'img'} src={atlas.src} alt={`Map of ${name}`} width={atlas.width} height={atlas.height}
  sx={{ display: 'block', width: '100%', height: '100%', borderRadius: 1 }}
/>;

// The enlarged map covers the page's own sections, so it lists what it numbers.
const Key = ({ atlas, onGo }) => {
  const go = goOnPlainClick(onGo);
  return <Stack sx={{ py: 2 }}>
    {atlas.pins.map(({ number, name, href, icon, note }) => <Stack key={number} direction={'row'} alignItems={'center'} gap={1} sx={{ minHeight: 36 }}>
      <RowNumber number={number}/>
      {icon ? <GameIcon src={icon.replace(/^\//, '')} size={24} alt={''}/> : null}
      {href
        ? <Link href={href} variant={'body2'} onClick={(event) => go(event, href)}>{name}</Link>
        : <Typography variant={'body2'}>{name}</Typography>}
      {note ? <Typography variant={'caption'} color={'text.secondary'}>{note}</Typography> : null}
    </Stack>)}
  </Stack>;
};

// A map as the game draws it, whole, with a number on everything the sections under it number.
const MapAtlas = ({ atlas, name, onGo }) => {
  const [open, setOpen] = useState(false);
  const { width, height } = atlas;
  const desktop = fit(atlas, atlas.island ? ISLAND : DESKTOP);
  const phone = fit(atlas, PHONE);
  const roomy = `@container (min-width: ${atlas.island ? ROOM.island : ROOM.map}px)`;
  const large = Math.max(LARGE.width / width, LARGE.height / height);

  return <Box sx={{ containerType: 'inline-size' }}>
    <Box
      sx={{ position: 'relative', width: '100%', maxWidth: 'var(--map-phone)', [roomy]: { maxWidth: 'var(--map-desktop)' } }}
      style={{ '--map-phone': `${width * phone}px`, '--map-desktop': `${width * desktop}px`, aspectRatio: `${width} / ${height}` }}
    >
      <Picture atlas={atlas} name={name}/>
      <Box aria-hidden sx={{ display: 'none', [roomy]: { display: 'block' } }}><Marks atlas={atlas} scale={desktop} onGo={onGo}/></Box>
      <Box aria-hidden sx={{ [roomy]: { display: 'none' } }}><Marks atlas={atlas} scale={phone} small/></Box>
      {/* A tap on the picture enlarges it too; the button below is the one the keyboard and a screen reader get. */}
      <Box aria-hidden onClick={() => setOpen(true)} sx={{ position: 'absolute', inset: 0, [roomy]: { display: 'none' } }}/>
    </Box>
    {/* Under the picture: on it, the button hid the numbers in its corner. */}
    <Button size={'small'} startIcon={<IconArrowsMaximize size={18}/>} aria-haspopup={'dialog'} onClick={() => setOpen(true)}
            sx={{ mt: 1, [roomy]: { display: 'none' } }}>
      Enlarge map
    </Button>
    <AppDialog open={open} onClose={() => setOpen(false)} title={name} size={'l'} phone={'full'}>
      <Box sx={{ mx: -2, overflowX: 'auto', flexShrink: 0 }}>
        <Box sx={{ position: 'relative', overflow: 'hidden' }} style={{ width: width * large, height: height * large }}>
          <Picture atlas={atlas} name={name}/>
          <Box aria-hidden><Marks atlas={atlas} scale={large} onGo={onGo}/></Box>
        </Box>
      </Box>
      <Key atlas={atlas} onGo={onGo}/>
    </AppDialog>
  </Box>;
};

export default MapAtlas;
