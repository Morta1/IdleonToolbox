import React from 'react';
import { Box, Grid, IconButton, Stack, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/router';
import BuildTab from './BuildTab';
import AuthorChip from './AuthorChip';
import { TagChip } from './styled';
import { hydrate } from '@utility/builds/hydrate';
import { cleanUnderscore } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';

// Render a stored (compact) build. hydrate() derives tab/talent metadata from
// the shared @website-data + talentPagesMap, so no extra data file is needed.
// Optional `actions` slot renders between the build header and the talent
// grid — used by the view page to place like/template/edit/delete.
// Optional `backHref` renders a back button inline with the title.
const BuildDetail = ({ build, actions = null, backHref = null }) => {
  const router = useRouter();
  const formatDate = useFormatDate();
  if (!build) return null;
  const hydrated = hydrate(build);
  const className = build.subclass || build.class;
  const createdMs = build.createdAt ? new Date(build.createdAt).getTime() : null;
  const updatedMs = build.updatedAt ? new Date(build.updatedAt).getTime() : null;
  const wasUpdated = createdMs && updatedMs && Math.abs(updatedMs - createdMs) > 1000;

  // Prefer router.back() so the filtered list URL stays preserved in browser
  // history. If there's nothing to pop (direct navigation), push the fallback.
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    }
    else if (backHref) {
      router.push(backHref);
    }
  };

  return (
    <Stack gap={2}>
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
        {build.description && (
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{build.description}</Typography>
        )}
      </Stack>

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
    </Stack>
  );
};

export default BuildDetail;
