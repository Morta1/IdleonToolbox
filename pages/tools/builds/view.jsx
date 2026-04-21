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

const ViewBuild = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const signedIn = !!state?.signedIn;
  const shortId = router.query?.id;

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
        title={`${build?.title || 'Build'} | Idleon Toolbox`}
        description={build?.description || 'Community build for Legends of Idleon'}
      />
      <Stack mt={2} gap={2}>
        {loading ? (
          <SimpleLoader message="Loading build…"/>
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
