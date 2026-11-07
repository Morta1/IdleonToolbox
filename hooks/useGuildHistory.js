import { useQuery } from '@tanstack/react-query';
import { fetchGuildIndex, fetchGuildDetail, fetchGlobalSnapshots } from '../services/guild-history';

const FIFTEEN_MIN = 15 * 60 * 1000;

export function useGuildIndex() {
  return useQuery({
    queryKey: ['guild-history', 'index'],
    queryFn: () => fetchGuildIndex(),
    staleTime: FIFTEEN_MIN,
    refetchOnWindowFocus: false
  });
}

export function useGuildDetail(guildId) {
  return useQuery({
    queryKey: ['guild-history', 'detail', guildId],
    queryFn: () => fetchGuildDetail(guildId),
    enabled: !!guildId,
    // A guild that isn't there won't be there on a second ask.
    retry: (count, error) => error?.status !== 404 && count < 3,
    staleTime: FIFTEEN_MIN,
    refetchOnWindowFocus: false
  });
}

export function useGlobalSnapshots(limit = 1) {
  return useQuery({
    queryKey: ['guild-history', 'global-snapshots', limit],
    queryFn: () => fetchGlobalSnapshots(limit),
    staleTime: FIFTEEN_MIN,
    refetchOnWindowFocus: false
  });
}
