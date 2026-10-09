// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import Box from '@mui/material/Box';
import { DashboardSettingsProvider, useAlertSettingsProps } from '@components/common/context/DashboardSettingsProvider';

const FakeAlert = ({ target, extra, onRowClick }) => {
  const props = useAlertSettingsProps('account', target, extra);
  return <div onClick={onRowClick}><span data-testid="icon" {...props}>icon</span></div>;
};

// A Box, as the real alerts are: the hook hands it `component: 'a'` when the alert has a page.
const LinkAlert = ({ target, onRowClick }) => {
  const props = useAlertSettingsProps('account', target);
  return <div onClick={onRowClick}><Box data-testid="icon" {...props}>icon</Box></div>;
};
const renderLink = (href, onOpenAlert, onRowClick) => render(<DashboardSettingsProvider onOpenAlert={onOpenAlert} hrefFor={() => href}>
  <LinkAlert target="World 7.spelunking.pageReads" onRowClick={onRowClick}/>
</DashboardSettingsProvider>).container.querySelector('[data-testid="icon"]');

describe('useAlertSettingsProps', () => {
  it('without a target the icon is not interactive', () => {
    const onOpenAlert = vi.fn();
    const { container } = render(<DashboardSettingsProvider onOpenAlert={onOpenAlert}><FakeAlert/></DashboardSettingsProvider>);
    const icon = container.querySelector('[data-testid="icon"]');
    expect(icon.getAttribute('role')).toBeNull();
    fireEvent.click(icon);
    expect(onOpenAlert).not.toHaveBeenCalled();
  });

  it('click and Enter open the quick edit with the element and extras, without bubbling', () => {
    const onOpenAlert = vi.fn();
    const onRowClick = vi.fn();
    const extra = { items: [{ key: 'Refinery1' }] };
    const { container } = render(<DashboardSettingsProvider onOpenAlert={onOpenAlert}>
      <FakeAlert target="World 3.construction.materials" extra={extra} onRowClick={onRowClick}/>
    </DashboardSettingsProvider>);
    const icon = container.querySelector('[data-testid="icon"]');
    expect(icon.getAttribute('role')).toBe('button');
    expect(icon.getAttribute('tabindex')).toBe('0');
    expect(icon.getAttribute('aria-haspopup')).toBe('dialog');
    fireEvent.click(icon);
    expect(onOpenAlert).toHaveBeenCalledWith(icon, 'account', 'World 3.construction.materials', extra);
    expect(onRowClick).not.toHaveBeenCalled();
    fireEvent.keyDown(icon, { key: 'Enter' });
    fireEvent.keyDown(icon, { key: ' ' });
    fireEvent.keyDown(icon, { key: 'a' });
    expect(onOpenAlert).toHaveBeenCalledTimes(3);
  });

  it('names the icon after its alert', () => {
    const labelFor = vi.fn(() => 'Salt balance: Redox Salts');
    const extra = { items: [{ key: 'Refinery1' }] };
    const { container } = render(<DashboardSettingsProvider onOpenAlert={() => {}} labelFor={labelFor}>
      <FakeAlert target="World 3.construction.saltDeficit" extra={extra}/>
    </DashboardSettingsProvider>);
    expect(container.querySelector('[data-testid="icon"]').getAttribute('aria-label')).toBe('Salt balance: Redox Salts settings');
    expect(labelFor).toHaveBeenCalledWith('account', 'World 3.construction.saltDeficit', extra);
  });

  it('an alert with a page is a real link, and a plain click still opens the quick edit', () => {
    const onOpenAlert = vi.fn();
    const icon = renderLink('/account/world-7/spelunking?t=Lore', onOpenAlert);
    expect(icon.tagName).toBe('A');
    expect(icon.getAttribute('href')).toBe('/account/world-7/spelunking?t=Lore');
    expect(icon.getAttribute('role')).toBe('button');
    // fireEvent returns false when the default (following the link) was prevented.
    expect(fireEvent.click(icon)).toBe(false);
    expect(onOpenAlert).toHaveBeenCalledTimes(1);
  });

  it('modified clicks and Ctrl+Enter are left to the browser, without reaching the row', () => {
    const onOpenAlert = vi.fn();
    const onRowClick = vi.fn();
    // A hash href: jsdom implements no other navigation, and these clicks do follow the link.
    const icon = renderLink('#spelunking', onOpenAlert, onRowClick);
    expect(fireEvent.click(icon, { ctrlKey: true })).toBe(true);
    expect(fireEvent.click(icon, { metaKey: true })).toBe(true);
    expect(fireEvent.click(icon, { shiftKey: true })).toBe(true);
    expect(fireEvent.keyDown(icon, { key: 'Enter', ctrlKey: true })).toBe(true);
    expect(onOpenAlert).not.toHaveBeenCalled();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('without a page the icon stays a plain button, and Ctrl+click opens the quick edit', () => {
    const onOpenAlert = vi.fn();
    const icon = renderLink(null, onOpenAlert);
    expect(icon.tagName).toBe('DIV');
    expect(icon.getAttribute('href')).toBeNull();
    fireEvent.click(icon, { ctrlKey: true });
    expect(onOpenAlert).toHaveBeenCalledTimes(1);
  });
});
