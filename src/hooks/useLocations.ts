import { useLiveQuery } from 'dexie-react-hooks';
import { locationRepository } from '@/repositories/locationRepository';
import type { Location } from '@/types/models';

export function useLocations(): Location[] | undefined {
  return useLiveQuery(() => locationRepository.getAll(), []);
}
