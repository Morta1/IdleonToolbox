import { useLocalStorage } from '@mantine/hooks';

const STORAGE_KEY = 'pinned-guilds';

/**
 * Manages a persisted list of pinned guilds in localStorage.
 *
 * Each pinned guild is { id: string, name: string }.
 * The list is unbounded.
 *
 * SSR-safe: @mantine/hooks useLocalStorage initialises state with the
 * default value (empty array) on the server and hydrates from localStorage
 * inside a useEffect, preventing hydration mismatches.
 */
export function usePinnedGuilds() {
  const [pinnedGuilds, setPinnedGuilds] = useLocalStorage({
    key: STORAGE_KEY,
    defaultValue: []
  });

  const isPinned = (id) => pinnedGuilds.some((g) => g.id === id);

  const togglePin = (id, name) => {
    if (isPinned(id)) {
      setPinnedGuilds((current) => current.filter((g) => g.id !== id));
    } else {
      setPinnedGuilds((current) => [...current, { id, name }]);
    }
  };

  return { pinnedGuilds, isPinned, togglePin };
}
