import * as React from 'react';
import { useState } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useRouter } from 'next/router';
import usePin from '@components/common/favorites/usePin';
import {
  Alert,
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  listItemButtonClasses,
  ListItemText,
  Popover,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { IconFileExport, IconGripVertical, IconX } from '@tabler/icons-react';
import { Reorder } from 'framer-motion';
import { getPageIcon } from '@utility/pageIcons';
import { handleDownload, prefix } from '@utility/helpers';
import FileUploadButton from '@components/common/DownloadButton';

// An exported file is a plain array of pin entries. Anything else (a dashboard config, some other
// json) gets rejected rather than wiping the user's pins with garbage.
const isValidPins = (data) => Array.isArray(data)
  && data.every((page) => page && typeof page.name === 'string' && typeof page.url === 'string');

const PinnedPages = ({}) => {
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('lg'), { noSsr: true });
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState(null);
  const { pinnedPages, removePin, reorderPins, setPins } = usePin();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    if (isXs) {
      setIsOpen(!isOpen);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };
  const handleClose = () => {
    if (isXs) {
      setIsOpen(false);
    } else {
      setAnchorEl(null);
    }
  };

  const getQuery = ({ tab, nestedTab, deeplyNestedTab }) => {
    let query = {}
    if (router.query.profile) {
      query.profile = router.query.profile;
    }
    if (tab) {
      query.t = tab;
      if (nestedTab) {
        query.nt = nestedTab;
      }
      if (deeplyNestedTab) {
        query.dnt = deeplyNestedTab;
      }
    }
    return query;
  }

  const handleNavigation = (page) => {
    setAnchorEl(null);
    router.push({ pathname: page.url, query: getQuery(page) });
  }

  // Real href so the browser can offer "open in new tab/window" via middle click and the context menu.
  const getHref = (page) => {
    const query = new URLSearchParams(getQuery(page)).toString();
    return query ? `${page.url}?${query}` : page.url;
  }

  const handleLinkClick = (event, page) => {
    // Let the browser handle modified clicks (ctrl/cmd/shift/middle) so they open a new tab or window.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    handleNavigation(page);
  }

  const handleExport = () => {
    handleDownload(pinnedPages || [], 'it-pinned-pages');
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'pinned_pages_exported', {
        event_category: 'engagement',
        event_label: 'pinned_pages',
        value: pinnedPages?.length ?? 0
      });
    }
  }

  const handleImport = (data) => {
    if (!isValidPins(data)) {
      setResult({ severity: 'error', message: 'That file doesn\'t contain pinned pages' });
      return;
    }
    setPins(data);
    setResult({ severity: 'success', message: `Imported ${data.length} pinned page${data.length === 1 ? '' : 's'}` });
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'pinned_pages_imported', {
        event_category: 'engagement',
        event_label: 'pinned_pages',
        value: data.length
      });
    }
  }

  const renderActions = () => <Stack direction={'row'} gap={1} sx={{ px: 1, py: 1 }}>
    <FileUploadButton onFileUpload={handleImport}>Import</FileUploadButton>
    <Button onClick={handleExport}
            disabled={!pinnedPages?.length}
            variant={'outlined'}
            size={'small'}
            startIcon={<IconFileExport size={18}/>}>
      Export
    </Button>
  </Stack>;

  const truncateMiddle = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    const half = Math.floor(maxLength / 2);
    return text.slice(0, half) + '...' + text.slice(-half);
  }

  const getLabel = ({ name, tab, nestedTab, deeplyNestedTab }) => name.replace('-', ' ').capitalizeAllWords()
    + (tab ? ` - ${tab}` : '')
    + (nestedTab ? ` - ${nestedTab}` : '')
    + (deeplyNestedTab ? ` - ${deeplyNestedTab}` : '');

  const renderItem = (page, index, { dense, maxLabelLength }) => {
    const icon = getPageIcon(page);
    const label = getLabel(page);
    return (
      <Reorder.Item key={`${page.name}-${page.tab || ''}-${page.nestedTab || ''}-${page.deeplyNestedTab || ''}`}
                    value={page}>
        <ListItem
          component={'div'}
          sx={dense ? { pl: 1, pr: 7 } : { pr: 7 }}
          dense={dense}
          secondaryAction={<IconButton size="small" onClick={(e) => {
            e.stopPropagation();
            removePin(index)
          }}>
            <IconX size={20}/>
          </IconButton>}
        >
          <IconGripVertical size={16} style={{ cursor: 'grab', opacity: 0.5, marginRight: 4, flexShrink: 0 }}/>
          <ListItemButton
            component={'a'}
            href={getHref(page)}
            draggable={false}
            sx={{ [`&.${listItemButtonClasses.root}`]: { px: 0, pl: 1, gap: 1, minWidth: 0 } }}
            onClick={(e) => handleLinkClick(e, page)}>
            {icon ? <Box component={'img'}
                         src={`${prefix}${icon}.png`}
                         alt={''}
                         draggable={false}
                         sx={{ width: 28, height: 28, objectFit: 'scale-down', flexShrink: 0 }}/>
              : <Box sx={{ width: 28, height: 28, flexShrink: 0 }}/>}
            <Box sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {maxLabelLength ? truncateMiddle(label, maxLabelLength) : label}
            </Box>
          </ListItemButton>
        </ListItem>
      </Reorder.Item>
    )
  }

  return (
    <div>
      <ListItemButton
        disableGutters={!isXs}
        disableRipple
        sx={{
          color: 'white',
          borderRadius: '8px',
          ...(!isXs ? { p: '0 8px' } : {})
        }}
        selected={open}
        variant={'text'}
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <ListItemText component={'span'} disableTypography
                      sx={{ fontWeight: 'bold', fontSize: 16 }}>
          Pinned Pages
        </ListItemText>
        <KeyboardArrowDownIcon sx={{
          ml: 1,
          transform: isOpen || anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
          transitionProperty: 'transform',
          transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
          transitionDuration: '.15s'
        }}/>
      </ListItemButton>
      {isXs ? <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Reorder.Group axis="y" values={pinnedPages || []} onReorder={reorderPins}
                       style={{ listStyle: 'none', margin: 0, padding: '8px 0' }}>
          {pinnedPages?.map((page, index) => renderItem(page, index, { dense: false }))}
          {!pinnedPages?.length && <ListItemButton dense disabled>You don&apos;t have any pinned pages</ListItemButton>}
        </Reorder.Group>
        <Divider/>
        {renderActions()}
      </Collapse> : <Popover
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        sx={{ mt: 0.5 }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <Box sx={{ minWidth: 300 }}>
          {pinnedPages?.length > 0 ? (
            <Reorder.Group axis="y" values={pinnedPages} onReorder={reorderPins}
                           style={{ listStyle: 'none', margin: 0, padding: '8px 0' }}>
              {pinnedPages.map((page, index) => renderItem(page, index, { dense: true, maxLabelLength: 30 }))}
            </Reorder.Group>
          ) : (
            <List>
              <ListItem dense disabled>
                <ListItemText>
                  <Typography variant="body2">You don&apos;t have any pinned pages</Typography>
                </ListItemText>
              </ListItem>
            </List>
          )}
          <Divider/>
          {renderActions()}
        </Box>
      </Popover>}
      <Snackbar
        open={Boolean(result)}
        autoHideDuration={result?.severity === 'error' ? 5000 : 2000}
        onClose={() => setResult(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={result?.severity} variant="filled" onClose={() => setResult(null)}>
          {result?.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default PinnedPages;
