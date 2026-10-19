import { useQuery } from '@tanstack/react-query';
import { fetchPetMartHistory } from '../services/guild-history';

// The history changes once a day, at the 20:00 UTC restock.
const ONE_HOUR = 60 * 60 * 1000;

export function usePetMartHistory() {
  return useQuery({
    queryKey: ['pet-mart', 'history'],
    queryFn: () => fetchPetMartHistory(),
    staleTime: ONE_HOUR,
    refetchOnWindowFocus: false,
    retry: 1
  });
}
