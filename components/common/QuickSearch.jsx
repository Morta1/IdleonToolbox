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
  const breakpoint = useMediaQuery('(max-width: 1365px)', { noSsr: true });
  const router = useRouter();
  const { t, nt, dnt, ...updateQuery } = router?.query || {};

  // Format label to add spaces between words
  const formatLabel = (str) => {
    return str
      // Add space between lowercase and uppercase letters
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Add space between uppercase letters that are followed by lowercase letters
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      // Capitalize first letter of each word
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
      Object.keys(PAGES.ACCOUNT).forEach(category => {
        PAGES.ACCOUNT[category].categories.forEach(subCategory => {
          // Base URL for the page
          const baseUrl = `/account/${toKebabCase(category)}/${toKebabCase(subCategory.label)}`;

          // Add the main page
          items.push({
            label: formatLabel(subCategory.label),
            url: baseUrl,
            section: formatLabel(category),
            icon: subCategory.icon || PAGES.ACCOUNT[category].icon || 'default-icon'
          });

          // Add tabs if they exist
          if (subCategory.tabs && subCategory.tabs.length > 0) {
            subCategory.tabs.forEach(item => {
              items.push({
                label: `${formatLabel(subCategory.label)} - ${item?.tab || item}`,
                url: baseUrl,
                queryParams: { t: item?.tab || item },
                section: `${formatLabel(category)} - Tabs`,
                icon: item?.icon || subCategory.icon || PAGES.ACCOUNT[category].icon || 'default-icon',
                isTab: true
              });
            });
          }

          // Add nested tabs if they exist
          if (subCategory.nestedTabs && subCategory.nestedTabs.length > 0) {
            subCategory.nestedTabs.forEach(({ tab, nestedTab, nestedTabs, icon }) => {
              items.push({
                label: `${formatLabel(subCategory.label)} - ${tab} - ${nestedTab}`,
                url: baseUrl,
                queryParams: { t: tab, nt: nestedTab },
                section: `${formatLabel(category)} - Nested Tabs`,
                icon: icon || subCategory.icon || PAGES.ACCOUNT[category].icon || 'default-icon',
                isNestedTab: true
              });

              if (nestedTabs && nestedTabs.length > 0) {
                nestedTabs.forEach(deepNestedTab => {
                  items.push({
                    label: `${formatLabel(subCategory.label)} - ${tab} - ${nestedTab} - ${deepNestedTab}`,
                    url: baseUrl,
                    queryParams: { t: tab, nt: nestedTab, dnt: deepNestedTab },
                    section: `${formatLabel(category)} - Deep Nested Tabs`,
                    icon: icon || subCategory.icon || PAGES.ACCOUNT[category].icon || 'default-icon',
                    isDeepNestedTab: true
                  });
                });
              }
            });
          }
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
      handleNavigate(searchResults[selectedIndex].url, searchResults[selectedIndex].queryParams);
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
  const handleNavigate = (url, params) => {
    router.push({ pathname: url, query: { ...updateQuery, ...params } });
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
        borderRadius: isMd || breakpoint ? '8px' : '16px',
        padding: isMd || breakpoint ? '4px 8px' : '4px 12px',
        cursor: 'pointer'
      }}
      direction={'row'}
      alignItems={'center'}>
      <IconSearch stroke={'grey'} size={16}/>
      {!isMd && !breakpoint ? <Divider orientation={'vertical'} sx={{ mx: 1, bgcolor: 'grey', height: '80%' }}/> : null}
      {!isMd && !breakpoint ? <Typography sx={{ lineHeight: '11px' }} variant={'caption'} color={'text.secondary'}>
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
                onClick={() => handleNavigate(result.url, result.queryParams)}
                sx={{
                  borderRadius: '8px',
                  backgroundColor: index === selectedIndex ? 'rgba(0, 0, 0, .2)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, .2)' },
                  mb: 0.5
                }}
              >
                <ListItemIcon sx={{ width: 62, height: 62 }}>
                  {result.icon === 'default-icon' ? <Box sx={{
                    width: 48,
                    height: 48,
                    objectFit: 'scale-down',
                    borderRadius: '50%'
                  }}/> : <img
                    src={`${prefix}${result.icon}.png`}
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: 'scale-down'
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