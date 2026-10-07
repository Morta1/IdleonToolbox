// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { DashboardSettingsProvider, useAlertSettingsProps } from '@components/common/context/DashboardSettingsProvider';

const FakeAlert = ({ target, extra, onRowClick }) => {
  const props = useAlertSettingsProps('account', target, extra);
  return <div onClick={onRowClick}><span data-testid="icon" {...props}>icon</span></div>;
};

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
});
