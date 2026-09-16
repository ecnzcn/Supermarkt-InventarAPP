import { useLiveQuery } from 'dexie-react-hooks';
import { inventoryQueryService } from '@/services/inventoryQueryService';
import type { EnrichedItem } from '@/types/views';

/**
 * Live-reactive list of items enriched with category/location/tag data.
 * Re-runs automatically whenever any Dexie table touched by the query changes.
 */
export function useEnrichedItems(): EnrichedItem[] | undefined {
  return useLiveQuery(() => inventoryQueryService.getEnrichedItems(), []);
}
