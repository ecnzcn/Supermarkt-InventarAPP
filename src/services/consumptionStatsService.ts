import { transactionRepository } from '@/repositories/transactionRepository';
import type { InventoryTransaction, Item } from '@/types/models';

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Only recent usage is relevant for a forecast. */
export const STATS_WINDOW_DAYS = 90;
/** Below this observation span a rate would be mostly noise. */
export const MIN_SPAN_DAYS = 7;
/** At least this many consumption events are needed for a forecast. */
export const MIN_CONSUMPTION_EVENTS = 2;

export type ConsumptionStats =
  | { status: 'insufficient-data'; consumedTotal: number }
  | { status: 'no-consumption' }
  | {
      status: 'ok';
      consumedTotal: number;
      periodDays: number;
      perDay: number;
      perWeek: number;
      perMonth: number;
      /** Estimated days until the stock is empty (0 when already empty). */
      daysLeft: number;
      /** Timestamp of the estimated empty date. */
      emptyOn: number;
    };

/**
 * Counts a negative change as consumption: "−" (consumption) as well as lowering the
 * quantity by tapping the number (adjustment). Undone changes are deleted from the log
 * by inventoryService.undoTransaction, so they never show up here.
 */
export function isConsumption(tx: InventoryTransaction): boolean {
  return tx.delta < 0 && (tx.reason === 'consumption' || tx.reason === 'adjustment');
}

/** Pure calculation from one item's transactions – no database access. */
export function computeConsumptionStats(
  transactions: InventoryTransaction[],
  currentQuantity: number,
  now: number,
): ConsumptionStats {
  const windowStart = now - STATS_WINDOW_DAYS * DAY_MS;
  const recent = transactions.filter((tx) => tx.timestamp >= windowStart && tx.timestamp <= now);
  const consumption = recent.filter(isConsumption);

  if (recent.length > 0 && consumption.length === 0) {
    const firstTs = Math.min(...recent.map((tx) => tx.timestamp));
    if ((now - firstTs) / DAY_MS >= MIN_SPAN_DAYS) return { status: 'no-consumption' };
  }

  const consumedTotal = consumption.reduce((sum, tx) => sum + -tx.delta, 0);
  if (consumption.length < MIN_CONSUMPTION_EVENTS) return { status: 'insufficient-data', consumedTotal };

  const firstTs = Math.min(...recent.map((tx) => tx.timestamp));
  const periodDays = (now - firstTs) / DAY_MS;
  if (periodDays < MIN_SPAN_DAYS) return { status: 'insufficient-data', consumedTotal };

  const perDay = consumedTotal / periodDays;
  const daysLeft = currentQuantity <= 0 ? 0 : currentQuantity / perDay;

  return {
    status: 'ok',
    consumedTotal,
    periodDays,
    perDay,
    perWeek: perDay * 7,
    perMonth: perDay * 30,
    daysLeft,
    emptyOn: now + daysLeft * DAY_MS,
  };
}

export const consumptionStatsService = {
  async getForItem(item: Pick<Item, 'id' | 'quantity'>, now = Date.now()): Promise<ConsumptionStats> {
    const transactions = await transactionRepository.getByItemId(item.id);
    return computeConsumptionStats(transactions, item.quantity, now);
  },

  /** Forecasts for many items with a single query over the stats window. */
  async getForItems(items: Pick<Item, 'id' | 'quantity'>[], now = Date.now()): Promise<Map<string, ConsumptionStats>> {
    const transactions = await transactionRepository.getSince(now - STATS_WINDOW_DAYS * DAY_MS);
    const byItem = new Map<string, InventoryTransaction[]>();
    for (const tx of transactions) {
      const list = byItem.get(tx.itemId);
      if (list) list.push(tx);
      else byItem.set(tx.itemId, [tx]);
    }
    return new Map(items.map((item) => [item.id, computeConsumptionStats(byItem.get(item.id) ?? [], item.quantity, now)]));
  },
};
