// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { AppContext } from '@components/common/context/AppProvider';
import useLeaderboardSelf from '@hooks/useLeaderboardSelf';

const wrap = (state) => ({ children }) => <AppContext.Provider value={{ state }}>{children}</AppContext.Provider>;

afterEach(() => { cleanup(); localStorage.clear(); });

describe('useLeaderboardSelf', () => {
  it('uses the first character when there is no anonymous id', async () => {
    const { result } = renderHook(() => useLeaderboardSelf(), { wrapper: wrap({ uid: 'u1', characters: [{ name: 'Baker333' }] }) });
    await waitFor(() => expect(result.current.name).toBe('Baker333'));
    expect(result.current.signedIn).toBe(true);
  });

  it('prefers the stored Anon# id and reads upload state', async () => {
    localStorage.setItem('u1/anonId', JSON.stringify('Anon#ab12cd'));
    localStorage.setItem('u1/lastUploadParticipation', JSON.stringify('off'));
    localStorage.setItem('u1/lastUpload', JSON.stringify(1234));
    const { result } = renderHook(() => useLeaderboardSelf(), { wrapper: wrap({ uid: 'u1', characters: [{ name: 'Baker333' }] }) });
    await waitFor(() => expect(result.current).toEqual({ name: 'Anon#ab12cd', signedIn: true, participation: 'off', lastUpload: 1234 }));
  });

  it('never reports the main character while the stored Anon# id is still unread', async () => {
    localStorage.setItem('u1/anonId', JSON.stringify('Anon#ab12cd'));
    const seen = [];
    const { result } = renderHook(() => {
      const self = useLeaderboardSelf();
      seen.push(self.name);
      return self;
    }, { wrapper: wrap({ uid: 'u1', characters: [{ name: 'Baker333' }] }) });
    await waitFor(() => expect(result.current.name).toBe('Anon#ab12cd'));
    expect(seen).not.toContain('Baker333');
  });

  it('knows nobody before the account loads', () => {
    const { result } = renderHook(() => useLeaderboardSelf(), { wrapper: wrap({}) });
    expect(result.current).toEqual({ name: null, signedIn: false, participation: null, lastUpload: null });
  });
});
