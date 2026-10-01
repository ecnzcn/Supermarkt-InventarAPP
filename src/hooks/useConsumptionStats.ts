import { useLiveQuery } from 'dexie-react-hooks';
import { consumptionStatsService, type ConsumptionStats } from '@/services/consumptionStatsService';
import type { Item } from '@/types/models';

/** Live-reactive forecast for a single item (re-runs on item/transaction changes). */
export function useConsumptionStats(item: Pick<Item, 'id' | 'quantity'> | undefined): ConsumptionStats | undefined {
  return useLiveQuery(
    () => (item ? consumptionStatsService.getForItem(item) : undefined),
    [item?.id, item?.quantity],
  );
}

/** Live-reactive forecasts for a list of items, keyed by item id. */
export function useConsumptionForecasts(items: Pick<Item, 'id' | 'quantity'>[] | undefined): Map<string, ConsumptionStats> | undefined {
  const key = items?.map((i) => `${i.id}:${i.quantity}`).join('|');
  return useLiveQuery(
    () => (items ? consumptionStatsService.getForItems(items) : undefined),
    [key],
  );
}
