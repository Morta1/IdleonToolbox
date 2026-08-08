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
import Tooltip from '@components/Tooltip';
import SimpleLoader from '@components/common/SimpleLoader';
import { TagChip } from '@components/tools/builds/styled';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { AppContext } from '@components/common/context/AppProvider';
import BuildDetail from '@components/tools/builds/BuildDetail';
import LikeButton from '@components/tools/builds/LikeButton';
import UseAsTemplateButton from '@components/tools/builds/UseAsTemplateButton';
import { getBuild, deleteBuild, getBuildState } from 'services/builds';
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';

// Only the fields metadata needs. The full talent payload still comes from the
// Worker at runtime — this manifest exists so <title> resolves on first render
// instead of waiting on a cross-origin fetch Googlebot may never complete.
export function toBuildSummary(build) {
  return {
    shortId: build.shortId,
    title: build.title,
    class: build.class,
    subclass: build.subclass,
    ownerName: build.ownerName,
    tags: build.tags,
    likeCount: build.likeCount
  };
}

export function findInManifest(manifest, shortId) {
  if (!shortId) return null;
  return (manifest || []).find((entry) => entry.shortId === shortId) || null;
}

const classLabel = (summary) =>
  [summary.subclass?.replace(/_/g, ' '), summary.class].filter(Boolean).join(' ');

export function buildSeoTitle(summary) {
  if (!summary) return 'Build | Idleon Toolbox';
  return `${summary.title} — ${classLabel(summary)} Build | Idleon Toolbox`;
}

export function buildSeoDescription(summary) {
  if (!summary) return 'Community build for Legends of Idleon';
  const tags = (summary.tags || []).join(', ');
  const tagPart = tags ? ` — ${tags}.` : '.';
  return `${summary.title} by ${summary.ownerName}. ${classLabel(summary)} build for Legends of Idleon${tagPart} ${summary.likeCount || 0} likes.`;
}

export async function getStaticProps() {
  const builds = await fetchAllBuildsAtBuildTime();
  return { props: { manifest: builds.map(toBuildSummary) } };
}

const ViewBuild = ({ manifest }) => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const signedIn = !!state?.signedIn;
  const shortId = router.query?.id;

  // Resolves synchronously on first render for any build present at build time.
  const summary = findInManifest(manifest, shortId);

  const [build, setBuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!shortId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    getBuild(shortId)
      .then((doc) => {
        if (!cancelled) setBuild(doc);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Unable to load build.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // View count bumps happen server-side inside the GET detail handler —
    // no extra round-trip from the client.
    return () => {
      cancelled = true;
    };
  }, [shortId]);

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
      <NextSeo
        title={buildSeoTitle(summary)}
        description={buildSeoDescription(summary)}
      />
      <Stack mt={2} gap={2}>
        {loading ? (
          // The manifest resolves synchronously, so a crawler (and a human on a
          // slow connection) sees the real build title/author/tags immediately
          // instead of a bare spinner that contradicts the <title> NextSeo already
          // set above. The full talent payload still only arrives from the
          // runtime getBuild fetch, so the loader stays visible beneath it.
          summary ? (
            <Stack gap={2}>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                  {summary.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {classLabel(summary)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  by {summary.ownerName}
                </Typography>
                {summary.tags?.length > 0 && (
                  <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    {summary.tags.map((tag) => (
                      <TagChip key={tag} label={tag} size="small"/>
                    ))}
                  </Stack>
                )}
              </Box>
              <SimpleLoader message="Loading build…"/>
            </Stack>
          ) : (
            <SimpleLoader message="Loading build…"/>
          )
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : build ? (
          <BuildDetail
            build={build}
            backHref="/tools/builds"
            actions={
              <>
                {/* Stats cluster */}
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

export default ViewBuild;
