import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import { useRouter } from 'next/router';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Tooltip from '@components/Tooltip';
import SimpleLoader from '@components/common/SimpleLoader';
import { TagChip } from '@components/tools/builds/styled';
import { AppContext } from '@components/common/context/AppProvider';
import BuildDetail from '@components/tools/builds/BuildDetail';
import LikeButton from '@components/tools/builds/LikeButton';
import UseAsTemplateButton from '@components/tools/builds/UseAsTemplateButton';
import { getBuild, deleteBuild, getBuildState } from 'services/builds';

// The detail UI, with no opinion on where shortId came from. /tools/builds/<slug> reads it from a
// static path; /tools/builds/view reads it from ?id=, which is how a build published since the
// last deploy resolves — fallback: false gives it no page of its own. Each caller owns its
// <NextSeo>, because the two need different canonicals.

const BuildSummaryHeader = ({ summary }) => (
  <Box>
    <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>{summary.title}</Typography>
    <Typography variant="body1" color="text.secondary">
      {(summary.subclass || summary.class || '').replace(/_/g, ' ')}
    </Typography>
    <Typography variant="body2" color="text.secondary">by {summary.ownerName}</Typography>
    {summary.tags?.length > 0 && (
      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
        {summary.tags.map((tag) => <TagChip key={tag} label={tag} size="small"/>)}
      </Stack>
    )}
  </Box>
);

// What the build actually says. Counters are excluded on purpose: they tick on their own and a
// change in one must not re-render the talent tree.
const CONTENT_KEYS = ['title', 'description', 'class', 'subclass', 'tags', 'payload'];

const sameContent = (a, b) =>
  Boolean(a && b) && CONTENT_KEYS.every((key) => JSON.stringify(a[key]) === JSON.stringify(b[key]));

const BuildView = ({ shortId, summary, initialBuild = null }) => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const signedIn = !!state?.signedIn;

  // Seeded from static props where the page has them, so the build renders without waiting on the
  // Worker. The fetch below still runs - it is how edits since the last deploy, and the counters,
  // reach the page.
  const [build, setBuild] = useState(initialBuild);
  const [loading, setLoading] = useState(!initialBuild);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!shortId) return;
    let cancelled = false;
    // Reset for the new id. /tools/builds/<a> to /tools/builds/<b> is a client-side navigation
    // within one route, so this component stays mounted and useState's initialiser does not re-run
    // - without this the page renders the previous build under the new URL, and if the refresh
    // fails it never corrects itself, because initialBuild is truthy so the error is suppressed.
    setBuild(initialBuild);
    setFetched(false);
    setLoading(!initialBuild);
    setError('');
    getBuild(shortId)
      .then((doc) => {
        if (cancelled) return;
        // Unchanged since the deploy - the common case. Take the counters and keep the existing
        // object, so the talent tree keeps its identity and never re-renders.
        // Take every field that is not the talent payload - counters, but also a renamed owner or
        // a moved updatedAt, which would otherwise keep their deploy-time values forever.
        setBuild((prev) => (sameContent(prev, doc) ? { ...doc, payload: prev.payload } : doc));
        setFetched(true);
      })
      .catch((err) => {
        // A page seeded from static props already shows the build. Replacing it with an error
        // because a refresh failed would be a downgrade.
        if (!cancelled && !initialBuild) setError(err?.message || 'Unable to load build.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // View count bumps happen server-side inside the GET detail handler —
    // no extra round-trip from the client.
    return () => {
      cancelled = true;
    };
  }, [shortId, initialBuild]);

  // Single cheap call for viewer-specific flags. Detail responses scrub
  // ownerUid, so the worker derives `owner` on the server side.
  useEffect(() => {
    if (!signedIn || !shortId) {
      setLiked(false);
      setIsOwner(false);
      return;
    }
    let cancelled = false;
    getBuildState(shortId, state?.accessToken)
      .then((res) => {
        if (cancelled || !res) return;
        setLiked(!!res.liked);
        setIsOwner(!!res.owner);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [signedIn, shortId, state?.accessToken]);

  const handleDeleteClick = () => setDeleteDialogOpen(true);

  const handleConfirmDelete = async () => {
    if (!build?.shortId) return;
    setDeleting(true);
    try {
      await deleteBuild(build.shortId, state?.accessToken);
      setDeleteDialogOpen(false);
      router.push('/tools/builds');
    } catch (err) {
      setError(err?.message || 'Delete failed.');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Stack mt={2} gap={2}>
        {loading ? (
          // The summary comes from static props, so a crawler (and a human on a slow connection)
          // sees the real title/author/tags immediately rather than a bare spinner contradicting
          // the <title>. The talent payload still comes from the runtime fetch, so the loader
          // stays beneath it.
          <Stack gap={2}>
            {summary && <BuildSummaryHeader summary={summary}/>}
            <SimpleLoader message="Loading build…"/>
          </Stack>
        ) : error ? (
          // The summary is static props and is still correct - only the talent payload failed.
          // Dropping it would replace a page that says what it is with a bare error banner.
          <Stack gap={2}>
            {summary && <BuildSummaryHeader summary={summary}/>}
            <Alert severity="error">{error}</Alert>
          </Stack>
        ) : build ? (
          <BuildDetail
            build={build}
            backHref="/tools/builds"
            actions={
              <>
                {/* Counters are never baked into static props - they tick constantly and a stale
                    value is a visibly wrong number. They appear once the fetch answers. The row's
                    height comes from the buttons opposite, so nothing below moves when they do. */}
                {fetched && (
                  <Stack direction="row" alignItems="center" gap={1}>
                    <LikeButton
                      shortId={build.shortId}
                      initialLiked={liked}
                      initialCount={build.likeCount || 0}
                    />
                    <Tooltip title={`${build.viewCount || 0} view${build.viewCount === 1 ? '' : 's'}`}>
                      <Stack direction="row" alignItems="center" gap={0.5} sx={{ color: 'text.secondary' }}>
                        <VisibilityIcon sx={{ fontSize: 18 }}/>
                        <Typography variant="body2">{build.viewCount || 0}</Typography>
                      </Stack>
                    </Tooltip>
                  </Stack>
                )}

                <Box sx={{ flexGrow: 1 }}/>

                {/* Actions cluster — wraps together, not individually */}
                <Stack direction="row" alignItems="center" gap={0.5} flexWrap="wrap">
                  <UseAsTemplateButton shortId={build.shortId}/>
                  {isOwner && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton
                          component={Link}
                          href={`/tools/builds/edit?id=${encodeURIComponent(build.shortId)}`}
                          size="small"
                          color="primary"
                        >
                          <EditIcon fontSize="small"/>
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={deleting ? 'Deleting…' : 'Delete'}>
                        <span>
                          <IconButton
                            onClick={handleDeleteClick}
                            size="small"
                            color="error"
                            disabled={deleting}
                          >
                            <DeleteIcon fontSize="small"/>
                          </IconButton>
                        </span>
                      </Tooltip>
                    </>
                  )}
                </Stack>
              </>
            }
          />
        ) : (
          <Alert severity="info">Build not found.</Alert>
        )}
      </Stack>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete this build?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove <strong>{build?.title}</strong> and can't be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="inherit"
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            autoFocus
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BuildView;
