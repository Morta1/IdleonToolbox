import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import Tooltip from '@components/Tooltip';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Link from 'next/link';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { classToSlug } from '@utility/builds/class-paths.mjs';
import { buildHref } from '@utility/builds/build-pages.mjs';
import { classes } from '@website-data';
import {
  TEXT_MUTED,
  TEXT_STRONG,
  TEXT_SUBTLE,
  familyAccentBar,
  familyTheme,
  resolveHierarchy
} from '@utility/builds/classes';
import AuthorChip from './AuthorChip';
import { SurfaceCard, TagChip } from './styled';

// Calm text-first card. Family color shows as a thin left accent bar plus a
// subdued class breadcrumb — no gradient hero, no heavy uppercase labels.
//
// The card is a div with an onClick rather than one big <a>, because the breadcrumb inside it
// links to the class pages and anchors cannot nest. The title stays a real <a> so the card is
// still keyboard-reachable and middle-clickable. None of these reach the static export - that is
// CrawlLinks' job - they are here for the hydrated page.

const formatCount = (n) => {
  if (!n) return '0';
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
};

const Separator = () => (
  <Box
    sx={{
      width: 3,
      height: 3,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.25)',
      flexShrink: 0
    }}
  />
);

const ClassCrumb = ({ classKey, children }) => (
  <Typography
    component={Link}
    href={`/tools/builds/${classToSlug(classKey)}`}
    // Class slugs and build slugs share one namespace; this names which kind this link is.
    data-class-link=""
    // The card's onClick would otherwise fire too and navigate to the build instead.
    onClick={(e) => e.stopPropagation()}
    sx={{
      ...breadcrumbSx,
      textDecoration: 'none',
      '&:hover': { color: 'rgba(255,255,255,0.9)', textDecoration: 'underline' }
    }}
    noWrap
  >
    {children}
  </Typography>
);

const BuildCard = ({ build, staticIds }) => {
  const router = useRouter();
  if (!build) return null;

  const classKey = build.subclass || build.class;
  const hierarchy = resolveHierarchy(classKey);
  const theme = familyTheme(classKey);
  const iconIndex = classes.indexOf(classKey);
  const hasTags = Array.isArray(build.tags) && build.tags.length > 0;
  const views = build.viewCount || 0;
  // The static page when this build has one, view?id= when it was published since the last
  // deploy - fallback: false means there is no page to link it to yet.
  const href = buildHref(build, staticIds);

  return (
    <SurfaceCard
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        transition: 'border-color 120ms ease, transform 120ms ease',
        ...familyAccentBar(theme.primary),
        '&:hover': {
          transform: 'translateY(-1px)',
          borderColor: 'rgba(255,255,255,0.12)'
        }
      }}
    >
      <Box
        onClick={() => router.push(href)}
        sx={{
          p: 1.75,
          pl: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          cursor: 'pointer'
        }}
      >
        {/* Row 1: icon + title + likes/views */}
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Box sx={iconTileSx}>
            {iconIndex >= 0 ? (
              <img
                src={`${prefix}data/ClassIcons${iconIndex}.png`}
                alt={cleanUnderscore(classKey)}
                style={{ width: 24, height: 24, objectFit: 'contain' }}
              />
            ) : (
              <Typography sx={{ color: theme.primary, fontWeight: 700, fontSize: 14 }}>
                {classKey?.[0] || '?'}
              </Typography>
            )}
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              component={Link}
              href={href}
              onClick={(e) => e.stopPropagation()}
              sx={{ ...titleSx, display: 'block', textDecoration: 'none' }}
              noWrap
              title={build.title}
            >
              {build.title || '(untitled)'}
            </Typography>
            <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.25 }}>
              <ClassCrumb classKey={hierarchy.class}>
                {cleanUnderscore(hierarchy.class)}
              </ClassCrumb>
              {hierarchy.subclass && (
                <>
                  <Separator/>
                  <ClassCrumb classKey={hierarchy.subclass}>
                    {cleanUnderscore(hierarchy.subclass)}
                  </ClassCrumb>
                </>
              )}
            </Stack>
          </Box>

          <Stack direction="row" alignItems="center" gap={1} sx={{ flexShrink: 0, color: TEXT_STRONG }}>
            <Tooltip title={`${views} view${views === 1 ? '' : 's'}`}>
              <Stack direction="row" alignItems="center" gap={0.3}>
                <VisibilityIcon sx={{ fontSize: 14, color: TEXT_MUTED }}/>
                <Typography sx={{ ...metricLabelSx, color: TEXT_MUTED }}>
                  {formatCount(views)}
                </Typography>
              </Stack>
            </Tooltip>
            <Stack direction="row" alignItems="center" gap={0.35}>
              <FavoriteIcon sx={{ fontSize: 14, color: '#ff6b6b' }}/>
              <Typography sx={metricLabelSx}>{build.likeCount || 0}</Typography>
            </Stack>
          </Stack>
        </Stack>

        {/* Row 2: tags + author (only when something to show) */}
        {(hasTags || build.ownerName) && (
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1.25, ml: 5.5 }}>
            <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ flexGrow: 1, minWidth: 0 }}>
              {hasTags &&
                build.tags.slice(0, 3).map((tag) => (
                  <TagChip key={tag} label={tag} size="small"/>
                ))}
              {hasTags && build.tags.length > 3 && (
                <Tooltip title={build.tags.slice(3).join(', ')}>
                  <Typography variant="caption" sx={{ color: TEXT_MUTED, alignSelf: 'center' }}>
                    +{build.tags.length - 3}
                  </Typography>
                </Tooltip>
              )}
            </Stack>
            <Box sx={{ flexShrink: 0 }}>
              <AuthorChip ownerName={build.ownerName} isAnonymous={build.isAnonymous}/>
            </Box>
          </Stack>
        )}
      </Box>
    </SurfaceCard>
  );
};

const iconTileSx = {
  flexShrink: 0,
  width: 34,
  height: 34,
  borderRadius: 0.75,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.05)'
};

const titleSx = { fontWeight: 600, lineHeight: 1.25 };

const breadcrumbSx = { fontSize: 12, color: TEXT_SUBTLE };

const metricLabelSx = { fontSize: 12, fontWeight: 600 };

export default BuildCard;
