// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// This project does not load jest-dom, so assertions use plain DOM properties.
const detailText = () => screen.getByTestId('detail').textContent;

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next/link', () => ({ default: ({ children }) => <span>{children}</span> }));

const getBuild = vi.fn();
vi.mock('services/builds', () => ({
  getBuild: (...args) => getBuild(...args),
  getBuildState: vi.fn().mockResolvedValue(null),
  deleteBuild: vi.fn()
}));

// The real one draws the whole talent tree; all this test needs is which build reached it.
vi.mock('@components/tools/builds/BuildDetail', () => ({
  default: ({ build }) => <div data-testid="detail">{build?.title}</div>
}));

const BuildView = (await import('@components/tools/builds/BuildView')).default;

const staticBuild = (shortId, title) => ({
  shortId, title, class: 'Mage', subclass: 'Wizard', tags: [], payload: { talents: [1] }
});
const summaryOf = (shortId, title) => ({ shortId, title, class: 'Mage', ownerName: 'X', tags: [] });

describe('BuildView', () => {
  beforeEach(() => { getBuild.mockReset(); });

  it('renders the build from static props without waiting for the fetch', async () => {
    getBuild.mockReturnValue(new Promise(() => {})); // never settles
    render(<BuildView shortId="aaa" summary={summaryOf('aaa', 'A')} initialBuild={staticBuild('aaa', 'A')}/>);
    await screen.findByTestId('detail');
    expect(detailText()).toBe('A');
  });

  // The runtime fetch is how a build edited since the last deploy reaches the page.
  it('swaps in changed content when the fetch differs', async () => {
    getBuild.mockResolvedValue({ ...staticBuild('aaa', 'A edited'), likeCount: 3, viewCount: 9 });
    render(<BuildView shortId="aaa" summary={summaryOf('aaa', 'A')} initialBuild={staticBuild('aaa', 'A')}/>);
    await waitFor(() => expect(detailText()).toBe('A edited'));
  });

  // A seeded page already shows the build; replacing it with an error banner because a refresh
  // failed would be a downgrade.
  it('keeps showing the build when the refresh fails', async () => {
    getBuild.mockRejectedValue(new Error('network is down'));
    render(<BuildView shortId="aaa" summary={summaryOf('aaa', 'A')} initialBuild={staticBuild('aaa', 'A')}/>);
    await waitFor(() => expect(detailText()).toBe('A'));
    expect(screen.queryByText(/network is down/)).toBeNull();
  });

  // Without static props there is nothing to show, so a failure must still surface.
  it('shows the error when there was nothing to fall back to', async () => {
    getBuild.mockRejectedValue(new Error('network is down'));
    render(<BuildView shortId="aaa" summary={summaryOf('aaa', 'A')}/>);
    expect(await screen.findByText(/network is down/)).toBeTruthy();
  });

  // The regression this file exists for. /tools/builds/<a> to <b> is a client-side navigation
  // within one route: the component stays mounted, so useState's initialiser does not re-run. The
  // page rendered build A under build B's URL, and when B's refresh failed it stayed that way.
  it('does not show the previous build after the id changes', async () => {
    getBuild.mockRejectedValue(new Error('refresh failed'));
    const { rerender } = render(
      <BuildView shortId="aaa" summary={summaryOf('aaa', 'A')} initialBuild={staticBuild('aaa', 'A')}/>
    );
    await waitFor(() => expect(detailText()).toBe('A'));

    rerender(<BuildView shortId="bbb" summary={summaryOf('bbb', 'B')} initialBuild={staticBuild('bbb', 'B')}/>);
    await waitFor(() => expect(detailText()).toBe('B'));
    expect(detailText()).not.toBe('A');
  });
});
