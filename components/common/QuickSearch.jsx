import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  inputBaseClasses,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import { IconSearch } from '@tabler/icons-react';
import { useHotkeys } from '@mantine/hooks';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { offlinePages, PAGES } from '@components/constants';
import { prefix } from '@utility/helpers';
import { AppContext } from '@components/common/context/AppProvider';
import { offlineTools } from '@components/common/NavBar/AppDrawer/ToolsDrawer';

const QuickSearch = () => {
  const { state } = useContext(AppContext);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('lg'), { noSsr: true });
  const router = useRouter();
  const { t, nt, ...updateQuery } = router?.query || {};

  // Generate kebab case for URL parts
  const toKebabCase = (str) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  };

  // Generate all searchable items from PAGES object
  const allSearchItems = useMemo(() => {
    const items = [];

    // Process GENERAL pages
    Object.keys(PAGES.GENERAL).forEach(page => {
      if (!state?.signedIn && !state?.profile && !offlinePages.includes(page)) return;
      items.push({
        label: page.split(/(?=[A-Z])/).join(' ').capitalizeAllWords(),
        url: `/${toKebabCase(page)}`,
        section: 'General',
        icon: PAGES.GENERAL[page].icon || 'default-icon'
      });
    });

    if (state?.signedIn || state?.profile) {
      // Process ACCOUNT pages
      Object.keys(PAGES.ACCOUNT).forEach(category => {
        PAGES.ACCOUNT[category].categories.forEach(subCategory => {
          items.push({
            label: subCategory.label.split(/(?=[A-Z])/).join(' ').capitalize(),
            url: `/account/${toKebabCase(category)}/${toKebabCase(subCategory.label)}`,
            section: category.replace(/-/g, ' ').split(/(?=[A-Z])/).join(' ').capitalizeAllWords(),
            icon: subCategory.icon || PAGES.ACCOUNT[category].icon || 'default-icon'
          });
        });
      });
    }

    // Process TOOLS pages
    Object.keys(PAGES.TOOLS).forEach(tool => {
      if (!state?.signedIn && !state?.profile && !offlineTools[tool]) return;
      items.push({
        label: tool.split(/(?=[A-Z])/).join(' ').capitalizeAllWords(),
        url: `/tools/${toKebabCase(tool)}`,
        section: 'Tools',
        icon: PAGES.TOOLS[tool].icon || 'default-icon'
      });
    });

    return items;
  }, [state?.signedIn]);

  const handleKeyDown = (e) => {
    if (searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      e.preventDefault();
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      handleNavigate(searchResults[selectedIndex].url);
    }
  };

  // Handle search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const results = allSearchItems.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.section.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(results);
  }, [searchTerm, allSearchItems]);

  // Handle navigation
  const handleNavigate = (url) => {
    router.push({ pathname: url, query: updateQuery });
    setSearchOpen(false);
    setSearchTerm('');
  };

  // Reset search when dialog closes
  useEffect(() => {
    if (!searchOpen) {
      setSearchTerm('');
      setSelectedIndex(-1);
    }
  }, [searchOpen]);

  useHotkeys([
    ['mod+K', () => {
      if (!searchOpen) {
        setSearchOpen(true)
      } else {
        inputRef?.current?.focus?.();
      }
    }],
    ['esc', () => setSearchOpen(false)]
  ]);

  return <>
    <Stack
      onClick={() => setSearchOpen(true)}
      sx={{
        flexShrink: 0,
        width: 'fit-content',
        border: '1px solid rgba(255, 255, 255, 0.23)',
        height: '32px',
        borderRadius: isMd ? '8px' : '16px',
        padding: isMd ? '4px 8px' : '4px 12px',
        cursor: 'pointer',
        mr: 1
      }}
      direction={'row'}
      alignItems={'center'}>
      <IconSearch stroke={'grey'} size={16}/>
      {!isMd ? <Divider orientation={'vertical'} sx={{ mx: 1, bgcolor: 'grey', height: '80%' }}/> : null}
      {!isMd ? <Typography sx={{ lineHeight: '11px' }} variant={'caption'} color={'text.secondary'}>
        Ctrl + K
      </Typography> : null}
    </Stack>
    <Dialog onKeyDown={handleKeyDown}
            sx={{ borderRadius: '16px' }}
            scroll={'paper'}
            fullWidth
            maxWidth={'sm'}
            fullScreen={isSm}
            slotProps={{ paper: { elevation: 5 } }}
            open={searchOpen}
            onClose={() => setSearchOpen(false)}>
      <DialogTitle sx={{ padding: 0 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          autoFocus
          placeholder={'Search pages...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            [`.${inputBaseClasses.root} fieldset`]: {
              border: 'none',
              height: 0
            },
            [`.${inputBaseClasses.input}`]: {
              paddingLeft: '8px'
            }
          }}
          slotProps={{
            input: {
              startAdornment: <IconSearch stroke={'grey'}/>,
              endAdornment: <Chip tabIndex={-1} onClick={() => setSearchOpen(false)}
                                  sx={{ fontSize: 11, lineHeight: '11px' }}
                                  size="small" label={'esc'}/>
            }
          }}
        />
        <Divider/>
      </DialogTitle>
      <DialogContent sx={{ maxHeight: 450, minHeight: 450, p: '0 20px' }}>
        {searchResults.length > 0 ? (
          <List>
            {searchResults.map((result, index) => (
              <ListItemButton
                key={index}
                selected={index === selectedIndex}
                onClick={() => handleNavigate(result.url)}
                sx={{
                  borderRadius: '8px',
                  backgroundColor: index === selectedIndex ? 'rgba(0, 0, 0, .2)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, .2)' },
                  mb: 0.5
                }}
              >
                <ListItemIcon>
                  {result.icon === 'default-icon' ? <Box sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: 'rgba(0, 0, 0, .4)',
                    borderRadius: '50%'
                  }}/> : <img
                    src={`${prefix}${result.icon}.png`}
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: 'rgba(0, 0, 0, 0.08)'
                    }}
                  />}
                </ListItemIcon>
                <ListItemText
                  primary={result.label}
                  secondary={result.section}
                />
                <Typography variant="caption" color="text.secondary">
                  {result.url}
                </Typography>
              </ListItemButton>
            ))}
          </List>
        ) : searchTerm ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
            <Typography color="text.secondary">No results found</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
            <Typography color="text.secondary">Start typing to search for a page</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  </>;
};

export default QuickSearch;