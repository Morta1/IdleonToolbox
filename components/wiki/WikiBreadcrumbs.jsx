import React from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { navigateOnPlainClick } from './links';

// The trail wikiCrumbs builds. Real anchors, so a crawler climbs it too; a plain click routes in-app.
// On a listing or system page the last crumb is the page being read. An entity's trail stops at its
// kind (`endsAtPage` false), so no crumb there is current. A crumb with no href that is not the page
// is a kind with no listing, so it reads as plain text rather than a dead link.
// MUI 6 leaves the nav unlabelled, so the landmark is named here.
const WikiBreadcrumbs = ({ crumbs, onGo, endsAtPage = true }) => <Breadcrumbs aria-label={'breadcrumb'} separator={'/'} sx={{ typography: 'body2' }}>
  {crumbs.map(({ label, href }, i) => {
    if (href) {
      return <Link key={i} href={href} variant={'body2'} underline={'hover'}
                   onClick={navigateOnPlainClick(onGo, href, true)}>
        {label}
      </Link>;
    }
    return endsAtPage && i === crumbs.length - 1
      ? <Typography key={i} variant={'body2'} color={'text.secondary'} aria-current={'page'}>{label}</Typography>
      : <Typography key={i} variant={'body2'}>{label}</Typography>;
  })}
</Breadcrumbs>;

export default WikiBreadcrumbs;
