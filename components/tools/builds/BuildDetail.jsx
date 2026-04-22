import React from 'react';
import { Box, Grid, IconButton, Stack, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/router';
import BuildTab from './BuildTab';
import AuthorChip from './AuthorChip';
import ItemRefRenderer from './ItemRefRenderer';
import { TagChip } from './styled';
import { hydrate } from '@utility/builds/hydrate';
import { cleanUnderscore } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';

// Render a stored (compact) build. hydrate() derives tab/talent metadata from
// the shared @website-data + talentPagesMap, so no extra data file is needed.
// Optional `actions` slot renders between the build header and the main
// content — used by the view page for like / template / edit / delete.
// Optional `backHref` renders a back button inline with the title.
//
// Layout:
//   - On md+: two-column split when the description is long enough to carry
//     the left column. Description on the left (~60%), talent tabs stacked
//     vertically on the right (~40%).
//   - On sm-: single column, description followed by the talent grid.
//   - Short / empty descriptions fall back to the single-column layout so the
//     left column doesn't look lopsided.
const TWO_COLUMN_DESC_CHARS = 200;

const BuildDetail = ({ build, actions = null, backHref = null }) => {
  const router = useRouter();
  const formatDate = useFormatDate();
  if (!build) return null;
  const hydrated = hydrate(build);
  const className = build.subclass || build.class;
  const createdMs = build.createdAt ? new Date(build.createdAt).getTime() : null;
  const updatedMs = build.updatedAt ? new Date(build.updatedAt).getTime() : null;
  const wasUpdated = createdMs && updatedMs && Math.abs(updatedMs - createdMs) > 1000;

  const descriptionText = build.description || '';
  const twoColumn = descriptionText.length >= TWO_COLUMN_DESC_CHARS;

  // Always navigate to `backHref` rather than `router.back()` — the button is
  // labeled "Back to builds" and must actually land there regardless of how
  // the user got to this page. Example: template → /new → publish issues
  // `router.replace` to the new /view, leaving the template's /view as the
  // previous history entry; `router.back()` would silently send the user
  // back to the template instead of the list.
  const handleBack = () => {
    if (backHref) router.push(backHref);
    else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    }
  };

  const talentTabs = (
    <>
      {hydrated.tabs.map((tab, index) => (
        <Box key={`${build.shortId}-${tab.name}-${index}`}>
          <Typography variant="subtitle1" gutterBottom>
            {cleanUnderscore(tab.name)}
          </Typography>
          <BuildTab {...tab} createMode={false} tabIndex={index}/>
        </Box>
      ))}
    </>
  );

  const descriptionBlock = descriptionText
    ? <ItemRefRenderer text={descriptionText}/>
    : null;

  return (
    <Stack gap={2}>
      {/* Header block: back + title + meta + timestamps (always full width). */}
      <Stack gap={1}>
        <Stack direction="row" alignItems="center" gap={1}>
          {backHref && (
            <Tooltip title="Back to builds">
              <IconButton onClick={handleBack} size="small">
                <ArrowBackIcon/>
              </IconButton>
            </Tooltip>
          )}
          <Typography variant="h4">{build.title}</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="body2" color="text.secondary">
            {cleanUnderscore(className)}
          </Typography>
          <Box
            sx={{
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.7)',
              flexShrink: 0
            }}
          />
          <AuthorChip
            ownerName={build.ownerName}
            isAnonymous={build.isAnonymous}
          />
          {Array.isArray(build.tags) &&
            build.tags.map((tag) => <TagChip key={tag} label={tag} size="small"/>)}
        </Stack>
        {(createdMs || updatedMs) && (
          <Stack
            direction="row"
            gap={1.5}
            flexWrap="wrap"
            sx={{ color: 'text.secondary', fontSize: 12 }}
          >
            {createdMs && (
              <Tooltip title={formatDate(createdMs)}>
                <span>Created {formatDate(createdMs)}</span>
              </Tooltip>
            )}
            {wasUpdated && <>
              <div>-</div>
              <Tooltip title={formatDate(updatedMs)}>
                <span>Last Updated {formatDate(updatedMs)}</span>
              </Tooltip>
            </>}
          </Stack>
        )}
      </Stack>

      {/* Actions strip (like/template/edit/delete) sits between header and main
          content, full width. Always visible above whatever layout follows. */}
      {actions && (
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
          sx={{
            py: 1.5,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          {actions}
        </Stack>
      )}

      {/* Main content: two-column on desktop when the description is long
          enough, single column otherwise (or on mobile). */}
      {twoColumn ? (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          gap={3}
          alignItems="flex-start"
        >
          <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
            {descriptionBlock}
          </Box>
          <Stack
            gap={2}
            sx={{
              flexShrink: 0,
              width: { xs: '100%', md: 'auto' },
              // Cap so the right column doesn't swell past what a tab needs.
              maxWidth: { md: 380 }
            }}
          >
            {talentTabs}
          </Stack>
        </Stack>
      ) : (
        <>
          {descriptionBlock}
          <Grid container spacing={2}>
            {hydrated.tabs.map((tab, index) => (
              <Grid item key={`${build.shortId}-${tab.name}-${index}`}>
                <Typography variant="subtitle1" gutterBottom>
                  {cleanUnderscore(tab.name)}
                </Typography>
                <BuildTab {...tab} createMode={false} tabIndex={index}/>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Stack>
  );
};

export default BuildDetail;
