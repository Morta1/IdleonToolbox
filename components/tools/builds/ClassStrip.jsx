import React from 'react';
import { Box, Stack } from '@mui/material';
import Link from 'next/link';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { classes } from '@website-data';
import { ACCENT, CLASS_KEYS, FAMILY_ORDER, FAMILY_THEME, familyOf } from '@utility/builds/classes';
import { classToSlug, slugToClassKey } from '@utility/builds/class-paths.mjs';

// Row one is the four families plus All; row two appears only once a family is active and holds
// that family's subclasses. Every pill is a real <a href> rather than a menu item, so changing
// class is one click and survives middle-click - the MUI Menu this replaced took two and could
// do neither. It renders below the router gate, so it is absent from the static export;
// components/common/CrawlLinks.jsx is what puts class links in the exported HTML. Both rows
// scroll horizontally rather than wrapping, so the control stays one line tall no matter how
// large a family is.

const SUBCLASSES = Object.fromEntries(
  FAMILY_ORDER.map((fam) => [fam, CLASS_KEYS.filter((k) => familyOf(k) === fam && k !== fam)])
);

const Pill = ({ href, label, iconIndex, active, color, isClass = true }) => (
  <Box
    component={Link}
    href={href}
    // Names what the link is for. Class slugs and build slugs share one namespace, and a href
    // pattern cannot tell 'blood-berserker' from a build slug without knowing every class.
    // 'All' is the hub, not a class, so it is deliberately unmarked.
    {...(isClass ? { 'data-class-link': '' } : {})}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      flexShrink: 0,
      height: 34,
      px: 1.5,
      borderRadius: 999,
      textDecoration: 'none',
      fontSize: 13,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      color: active ? color : 'rgba(255,255,255,0.75)',
      background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? `${color}88` : 'rgba(255,255,255,0.08)'}`,
      '&:hover': { background: active ? `${color}33` : 'rgba(255,255,255,0.07)' }
    }}
  >
    {iconIndex >= 0 && (
      <img
        src={`${prefix}data/ClassIcons${iconIndex}.png`}
        alt=""
        width={18}
        height={18}
        style={{ objectFit: 'contain' }}
      />
    )}
    {label}
  </Box>
);

const Row = ({ children }) => (
  <Stack
    direction="row"
    gap={1}
    sx={{
      overflowX: 'auto',
      pb: 0.5,
      '&::-webkit-scrollbar': { height: 4 },
      '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: 999 }
    }}
  >
    {children}
  </Stack>
);

const ClassStrip = ({ activeSlug }) => {
  const activeKey = activeSlug ? slugToClassKey(activeSlug) : null;
  const activeFamily = activeKey ? familyOf(activeKey) : null;
  const subclasses = activeFamily ? SUBCLASSES[activeFamily] : [];

  return (
    <Stack gap={1} sx={{ mb: 2 }}>
      <Row>
        <Pill
          href="/tools/builds"
          label="All"
          iconIndex={-1}
          isClass={false}
          active={!activeKey}
          color={ACCENT.primary}
        />
        {FAMILY_ORDER.map((fam) => (
          <Pill
            key={fam}
            href={`/tools/builds/${classToSlug(fam)}`}
            label={fam}
            iconIndex={classes.indexOf(fam)}
            active={activeKey === fam}
            color={FAMILY_THEME[fam].primary}
          />
        ))}
      </Row>
      {subclasses.length > 0 && (
        <Row>
          {subclasses.map((key) => (
            <Pill
              key={key}
              href={`/tools/builds/${classToSlug(key)}`}
              label={cleanUnderscore(key)}
              iconIndex={classes.indexOf(key)}
              active={activeKey === key}
              color={FAMILY_THEME[activeFamily].primary}
            />
          ))}
        </Row>
      )}
    </Stack>
  );
};

export default ClassStrip;
