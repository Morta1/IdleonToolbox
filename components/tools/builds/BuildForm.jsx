import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import Tooltip from '@components/Tooltip';
import { useRouter } from 'next/router';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AppContext } from '@components/common/context/AppProvider';
import BuildTab from './BuildTab';
import BuildDetail from './BuildDetail';
import ClassPicker from './ClassPicker';
import RichTextEditor from './RichTextEditor';
import { hydrate, hydrateEmpty } from '@utility/builds/hydrate';
import { toStorageBuild } from '@utility/builds/compact';
import { clearDraft, loadDraft, makeDebouncedSaver } from '@utility/builds/draft';
import { cleanUnderscore } from '@utility/helpers';
import { createBuild, updateBuild } from 'services/builds';
import {
  ACCENT,
  familyAccentBar,
  familyTheme,
  resolveHierarchy
} from '@utility/builds/classes';
import { PillTextField, SurfaceCard, TagChip } from './styled';
import { TAG_OPTIONS } from '@utility/builds/tags';

const toClassKey = (build) => build?.subclass || build?.class || '';

const applyTalentChange = (tabs, tabIndex, nextTalents) => {
  return tabs.map((tab, i) => (i === tabIndex ? { ...tab, talents: nextTalents } : tab));
};

const applyNoteChange = (tabs, tabIndex, note) =>
  tabs.map((tab, i) => (i === tabIndex ? { ...tab, note } : tab));

const BuildForm = ({
  mode = 'create', // 'create' | 'edit'
  initialBuild = null, // existing build from the worker (for edit / template)
  backHref = null
}) => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const signedIn = !!state?.signedIn;

  // Core form state
  const [classKey, setClassKey] = useState(toClassKey(initialBuild));
  const [title, setTitle] = useState(initialBuild?.title || '');
  const [description, setDescription] = useState(initialBuild?.description || '');
  const [tags, setTags] = useState(initialBuild?.tags || []);
  const [isAnonymous, setIsAnonymous] = useState(!!initialBuild?.isAnonymous);
  const [tabs, setTabs] = useState(() => {
    if (initialBuild && toClassKey(initialBuild)) {
      return hydrate(initialBuild).tabs;
    }
    return [];
  });

  const [previewOn, setPreviewOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [restoredDraftNotice, setRestoredDraftNotice] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [pendingClassKey, setPendingClassKey] = useState(null);
  const debouncedSaveRef = useRef(makeDebouncedSaver(1000));

  // If the initialBuild prop arrives / changes after mount (e.g. the parent
  // router hydrated query params on the second render, or the template fetch
  // resolved after BuildForm was already rendered), re-seed the form state
  // from it. Keyed on shortId so we don't re-sync on every render.
  const syncedShortIdRef = useRef(initialBuild?.shortId ?? null);
  useEffect(() => {
    const incomingId = initialBuild?.shortId ?? null;
    if (incomingId === syncedShortIdRef.current) return;
    syncedShortIdRef.current = incomingId;
    if (!initialBuild) return;
    setClassKey(toClassKey(initialBuild));
    setTitle(initialBuild.title || '');
    setDescription(initialBuild.description || '');
    setTags(initialBuild.tags || []);
    setIsAnonymous(!!initialBuild.isAnonymous);
    if (toClassKey(initialBuild)) {
      setTabs(hydrate(initialBuild).tabs);
    } else {
      setTabs([]);
    }
  }, [initialBuild]);

  // Detect saved draft on mount — defer the actual restore until the user
  // confirms in the dialog.
  useEffect(() => {
    if (mode !== 'create') return;
    if (initialBuild) return; // template flow — don't overwrite
    const saved = loadDraft();
    if (saved?.draft) setPendingDraft(saved.draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyDraft = (d) => {
    setClassKey(d.classKey || '');
    setTitle(d.title || '');
    setDescription(d.description || '');
    setTags(d.tags || []);
    setIsAnonymous(!!d.isAnonymous);
    if (d.classKey) {
      const h = resolveHierarchy(d.classKey);
      const hydrated = hydrate({ class: h.class, subclass: h.subclass, payload: d.payload });
      setTabs(hydrated.tabs);
    }
    setRestoredDraftNotice(true);
  };

  const handleRestoreDraft = () => {
    if (pendingDraft) applyDraft(pendingDraft);
    setPendingDraft(null);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setPendingDraft(null);
  };

  // Persist draft on change (create mode only — edit mode saves through API)
  useEffect(() => {
    if (mode !== 'create') return;
    if (!classKey) return;
    debouncedSaveRef.current({
      classKey,
      title,
      description,
      tags,
      isAnonymous,
      payload: toStorageBuild({
        class: resolveHierarchy(classKey)?.class,
        subclass: resolveHierarchy(classKey)?.subclass,
        title,
        description,
        tags,
        isAnonymous,
        tabs
      }).payload
    });
  }, [mode, classKey, title, description, tags, isAnonymous, tabs]);

  const applyClassChange = (nextKey) => {
    if (!nextKey) {
      setClassKey('');
      setTabs([]);
      return;
    }
    const h = resolveHierarchy(nextKey);
    const empty = hydrateEmpty(h.class, h.subclass);
    setClassKey(nextKey);
    setTabs(empty.tabs);
  };

  const handleClassChange = (nextKey) => {
    if (classKey && tabs.length > 0 && nextKey !== classKey) {
      setPendingClassKey(nextKey);
      return;
    }
    applyClassChange(nextKey);
  };

  const handleConfirmClassChange = () => {
    applyClassChange(pendingClassKey);
    setPendingClassKey(null);
  };

  const handleCustomBuildChange = ({ tabIndex, tabTalents, tabNote }) => {
    if (tabTalents) {
      setTabs((prev) => applyTalentChange(prev, tabIndex, tabTalents));
    }
    // tabNote is only emitted by the "Remove" button on legacy notes — edit
    // mode doesn't render a note editor. An empty string clears the note so
    // compactPayload drops it from storage on the next save.
    if (tabNote != null) {
      setTabs((prev) => applyNoteChange(prev, tabIndex, tabNote));
    }
  };

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 5)
    );
  };

  const canSubmit = !!title.trim() && !!classKey && !submitting;

  // Mirror BuildDetail's back pattern — pop history so we don't push a fresh
  // entry and create an edit ↔ view loop.
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else if (backHref) {
      router.push(backHref);
    }
  };

  const handleSubmit = async () => {
    if (!signedIn) {
      setError('Sign in to publish.');
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const hierarchy = resolveHierarchy(classKey);
      // Author identity comes strictly from the in-game main character name.
      // Never from JWT / Firebase displayName. If no character is loaded, we
      // send null and the server uses a neutral placeholder.
      const mainChar = state?.characters?.[0]?.name || null;
      const body = {
        ...toStorageBuild({
          class: hierarchy.class,
          subclass: hierarchy.subclass,
          title,
          description,
          tags,
          isAnonymous,
          tabs
        }),
        ownerName: mainChar
      };
      let shortId;
      if (mode === 'edit' && initialBuild?.shortId) {
        await updateBuild(initialBuild.shortId, body, state?.accessToken);
        shortId = initialBuild.shortId;
      } else {
        const res = await createBuild(body, state?.accessToken);
        shortId = res?.shortId;
      }
      clearDraft();
      if (shortId) {
        // replace, not push — otherwise history is [..., view, edit, view]
        // and the back button pingpongs between edit and view.
        router.replace(`/tools/builds/view?id=${encodeURIComponent(shortId)}`);
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // Stacking layout:
  //   1. Sticky header with class/subclass picker + title + preview/publish
  //   2. Main content: tabs (editable) on the left, metadata sidebar on the right
  const hierarchy = resolveHierarchy(classKey);

  // Only compute the preview hydration when preview mode is actually on —
  // `toStorageBuild` walks every tab/talent and reallocates arrays, so doing
  // it on every keystroke while the editor is active was wasted work.
  const hydratedForPreview =
    previewOn && classKey && hierarchy
      ? {
          class: hierarchy.class,
          subclass: hierarchy.subclass,
          title: title || '(untitled)',
          description,
          tags,
          ownerName: isAnonymous ? null : (state?.characters?.[0]?.name || 'You'),
          isAnonymous,
          payload: toStorageBuild({
            class: hierarchy.class,
            subclass: hierarchy.subclass,
            title,
            description,
            tags,
            isAnonymous,
            tabs
          }).payload
        }
      : null;

  return (
    <Stack gap={3}>
      <SurfaceCard
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: { md: 'center' },
          position: 'sticky',
          top: 0,
          zIndex: 2,
          py: 1.5,
          px: 2
        }}
      >
        {backHref && (
          <Tooltip title="Back">
            <IconButton onClick={handleBack} size="small">
              <ArrowBackIcon/>
            </IconButton>
          </Tooltip>
        )}
        <ClassPicker
          value={classKey || null}
          onChange={(next) => handleClassChange(next || '')}
          label="Class"
        />
        <PillTextField
          size="small"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          inputProps={{ maxLength: 120 }}
          sx={{ flexGrow: 1, minWidth: 240 }}
        />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={previewOn ? 'preview' : 'edit'}
          onChange={(_, v) => v && setPreviewOn(v === 'preview')}
        >
          <ToggleButton value="edit">Edit</ToggleButton>
          <ToggleButton value="preview">Preview</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {mode === 'edit' ? 'Save changes' : 'Publish'}
        </Button>
      </SurfaceCard>

      {!signedIn && (
        <Alert severity="info">You need to sign in before you can publish a build.</Alert>
      )}

      {!classKey && (
        <Alert severity="info">Pick a class / subclass to start building.</Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {classKey && previewOn && hydratedForPreview && (
        <BuildDetail build={hydratedForPreview}/>
      )}

      {classKey && !previewOn && (
        // Flex row + flex-wrap instead of MUI Grid so the split engages only
        // when the container actually has room for both halves. MUI Grid's
        // percentage-based columns (xl=8/4) produced a ~348px right column at
        // 1536px viewport, but the tab card needs ~358px — the overflow
        // collided with the editor. With basis-based flex the right column
        // stays a fixed 360px and the left grows up to a cap; when the
        // container can't fit both (left's min-basis + right + gap), right
        // wraps below. The editor's max-width + `justifyContent: space-between`
        // turns extra room in wide viewports into visible gap between the two.
        <Stack
          direction="row"
          gap={2}
          flexWrap="wrap"
          alignItems="flex-start"
          justifyContent="space-between"
        >
          {/* Left column: the rich-text guide + build-level metadata
              (tags, anonymous toggle). flex-basis 600 so right wraps when
              there's no room; max-width 1000 so on wide viewports the
              editor doesn't stretch into uncomfortably-long line lengths
              and the surplus room materializes as gap to the right. */}
          <Stack gap={2} sx={{ flex: '1 1 600px', maxWidth: 1000, minWidth: 0 }}>
            <RichTextEditor
              ariaLabel="Description"
              minRows={15}
              maxLength={2000}
              value={description}
              onChange={setDescription}
              placeholder="Explain the strategy, gearing, etc. Type @ to reference gear inline."
            />
            <Stack gap={0.5}>
              <Typography variant="subtitle2">Tags (max 5)</Typography>
              <Stack direction="row" gap={0.5} flexWrap="wrap">
                {TAG_OPTIONS.map((tag) => {
                  const selected = tags.includes(tag);
                  return (
                    <TagChip
                      key={tag}
                      label={tag}
                      size="small"
                      onClick={() => toggleTag(tag)}
                      sx={selected ? {
                        bgcolor: ACCENT.primarySoft,
                        color: ACCENT.primary,
                        borderColor: ACCENT.primaryBorder
                      } : undefined}
                    />
                  );
                })}
              </Stack>
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
              }
              label="Publish as Anonymous"
            />
          </Stack>
          {/* Right column: talent tab cards stacked vertically at a fixed
              360px (320 grid + 40 card padding). Doesn't shrink — when the
              container can't accommodate left's 600px basis + 360 + 16 gap,
              the flex-wrap drops this column to the row below, where it
              left-aligns naturally. Authors write tab-level prose in the
              main description via @-mentions rather than a per-tab note. */}
          <Stack direction="column" gap={2} sx={{ flex: '0 0 360px', width: 360 }}>
            {tabs.map((tab, index) => {
              const tabTheme = familyTheme(tab.name);
              return (
                <SurfaceCard
                  key={`${classKey}-${tab.name}-${index}`}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    ...familyAccentBar(tabTheme.primary)
                  }}
                >
                  <Box sx={{ p: 2, pl: 2.5 }}>
                    <Stack
                      direction="row"
                      alignItems="baseline"
                      gap={1}
                      sx={{ mb: 1.5 }}
                    >
                      <Typography
                        variant="overline"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: 0.6,
                          color: tabTheme.primary,
                          lineHeight: 1
                        }}
                      >
                        Tab {index + 1}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {cleanUnderscore(tab.name)}
                      </Typography>
                    </Stack>
                    <BuildTab
                      {...tab}
                      createMode
                      layout="row"
                      onCustomBuildChange={handleCustomBuildChange}
                      tabIndex={index}
                    />
                  </Box>
                </SurfaceCard>
              );
            })}
          </Stack>
        </Stack>
      )}

      <Snackbar
        open={restoredDraftNotice}
        autoHideDuration={4000}
        onClose={() => setRestoredDraftNotice(false)}
        message="Draft restored."
      />

      {/* Restore-draft dialog */}
      <Dialog
        open={!!pendingDraft}
        onClose={handleDiscardDraft}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Restore draft?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You had an unfinished build from an earlier session. Restore it, or start fresh?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDiscardDraft} color="inherit">
            Discard
          </Button>
          <Button onClick={handleRestoreDraft} variant="contained" autoFocus>
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* Class-change confirmation dialog */}
      <Dialog
        open={!!pendingClassKey}
        onClose={() => setPendingClassKey(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Change class?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Changing class will reset all talent levels for this build. Continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingClassKey(null)} color="inherit">
            Keep current
          </Button>
          <Button onClick={handleConfirmClassChange} variant="contained" autoFocus>
            Change class
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default BuildForm;
