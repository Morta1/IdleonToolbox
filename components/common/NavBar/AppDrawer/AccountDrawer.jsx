import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Collapse, Divider, List, ListItem, ListItemIcon, ListItemText, Stack } from '@mui/material';
import React, { useContext, useState } from 'react';
import { prefix } from '@utility/helpers';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import Kofi from '../../Kofi';
import { AppContext } from '@components/common/context/AppProvider';
import useFormatDate from '@hooks/useFormatDate';

import ListItemButton from '@mui/material/ListItemButton';
import { PAGES } from '@components/constants';

const nestedOptionPadding = 35;

const AccountDrawer = ({ fromList }) => {
  const { state } = useContext(AppContext);
  const formatDate = useFormatDate();
  const [accordions, setAccordions] = useState({});
  const router = useRouter();

  // Tab params belong to the page being left, not the one being opened.
  const { t, nt, dnt, ...updatedQuery } = router.query;

  const buildUrl = (section, label) => section
    ? `/account/${section.split(' ').join('-')}/${label}`
    : `/account/${label}`;

  const handleClick = (label, categories) => {
    if (categories) {
      return setAccordions({ ...accordions, [label]: !accordions?.[label] });
    } else {
      trackNav(buildUrl('', label));
    }
  }

  // Navigation itself is handled by next/link so the target page's chunk gets prefetched while
  // the item is on screen — clicking then costs ~100ms instead of a multi-second chunk download.
  const trackNav = (url) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'handle_nav', {
        event_category: url,
        event_label: 'engagement',
        value: 1
      })
    }
  }

  const isSelected = (label) => {
    return router.pathname.includes(label);
  }

  return (
    (<Stack sx={{ height: '100%', overflowY: 'auto' }}>
      <List sx={{ ...(fromList ? { padding: 0 } : {}) }}>
        {!fromList && state?.account?.accountCreateTime ? <ListItem>Account created
          at: {formatDate(state?.account?.accountCreateTime)}</ListItem> : null}
        {Object.entries(PAGES.ACCOUNT).map(([key, value], index) => {
          const { icon, categories, style } = value;
          const selectedSection = isSelected(key?.split(' ')?.join('-'));
          return (
            (<React.Fragment key={key + ' ' + index}>
              <ListItemButton
                data-cy={key}
                selected={selectedSection}
                {...(categories ? {} : {
                  component: NextLink,
                  href: { pathname: buildUrl('', key), query: updatedQuery }
                })}
                onClick={() => handleClick(key, categories)}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <img width={32} height={32} style={{ objectFit: 'contain', ...style }}
                       src={`${prefix}${icon}.png`} alt=""/>
                </ListItemIcon>
                <ListItemText style={{ marginLeft: 10 }} primary={key.split('-').join(' ').capitalizeAllWords()}/>
                {categories ? accordions?.[key] ? <ExpandLess/> : <ExpandMore/> : null}
              </ListItemButton>
              {categories ? <Collapse in={accordions?.[key]} timeout="auto" unmountOnExit>
                {categories?.map((category, categoryIndex) => {
                  const label = category?.label.split(/(?=[A-Z])/).map((str) => str.toLowerCase()).join('-');
                  const selectedSubSection = isSelected(label);
                  return (
                    (<ListItemButton
                      component={NextLink}
                      href={{ pathname: buildUrl(key, label), query: updatedQuery }}
                      selected={selectedSubSection}
                      data-cy={label}
                      key={category + ' ' + categoryIndex}
                      style={{ paddingLeft: nestedOptionPadding }}
                      onClick={() => trackNav(buildUrl(key, label))}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <img width={32} height={32}
                             style={{ objectFit: 'contain', ...category?.style }}
                             src={`${prefix}${category.icon}.png`}
                             alt=""/>
                      </ListItemIcon>

                      <ListItemText
                        slotProps={{
                          primary: {
                            color: selectedSubSection ? '#99ccff' : 'inherit'
                          }
                        }}
                        style={{ marginLeft: 10 }}
                        primary={category?.label
                          .split(/(?=[A-Z])/)
                          .join(' ')
                          .capitalize()}
                      />
                    </ListItemButton>)
                  );
                })}
              </Collapse> : null}
            </React.Fragment>)
          );
        })}
      </List>
      {!fromList ? <List style={{ marginTop: 'auto', paddingBottom: 0 }}>
        <ListItem>
          <ListItemText>
            <Kofi display={'inline-block'}/>
          </ListItemText>
        </ListItem>
      </List> : null}
      <Divider/>
    </Stack>)
  );
};

export default AccountDrawer;
