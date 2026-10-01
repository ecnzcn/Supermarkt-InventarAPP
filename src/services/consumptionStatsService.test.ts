import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/database';
import type { InventoryTransaction, TransactionReason } from '@/types/models';
import { computeConsumptionStats, consumptionStatsService, DAY_MS } from './consumptionStatsService';

const NOW = Date.UTC(2026, 9, 1, 12);
let seq = 0;
function tx(daysAgo: number, delta: number, reason: TransactionReason, itemId = 'a'): InventoryTransaction {
  seq += 1;
  return { id: `t${seq}`, itemId, delta, previousQuantity: 0, newQuantity: 0, reason, timestamp: NOW - daysAgo * DAY_MS };
}

describe('computeConsumptionStats', () => {
  it('needs data before forecasting', () => {
    expect(computeConsumptionStats([], 5, NOW)).toEqual({ status: 'insufficient-data', consumedTotal: 0 });
    // only one consumption event
    expect(computeConsumptionStats([tx(20, -1, 'consumption')], 5, NOW).status).toBe('insufficient-data');
    // two events but observed for less than 7 days
    expect(computeConsumptionStats([tx(3, -1, 'consumption'), tx(1, -1, 'consumption')], 5, NOW).status).toBe('insufficient-data');
  });

  it('calculates rate, weekly/monthly usage and remaining days', () => {
    // 14 units consumed over 28 days -> 0.5/day
    const txs = [tx(28, 6, 'purchase'), tx(21, -4, 'consumption'), tx(14, -4, 'consumption'), tx(7, -6, 'consumption')];
    const stats = computeConsumptionStats(txs, 5, NOW);
    expect(stats.status).toBe('ok');
    if (stats.status !== 'ok') return;
    expect(stats.consumedTotal).toBe(14);
    expect(stats.perDay).toBeCloseTo(0.5);
    expect(stats.perWeek).toBeCloseTo(3.5);
    expect(stats.perMonth).toBeCloseTo(15);
    expect(stats.daysLeft).toBeCloseTo(10);
    expect(stats.emptyOn).toBe(NOW + 10 * DAY_MS);
  });

  it('counts lowering the quantity directly as consumption, but not increases or purchases', () => {
    const txs = [tx(10, -2, 'adjustment'), tx(5, 3, 'adjustment'), tx(4, 4, 'purchase'), tx(2, -2, 'consumption')];
    const stats = computeConsumptionStats(txs, 4, NOW);
    expect(stats.status === 'ok' && stats.consumedTotal).toBe(4);
  });

  it('ignores transactions older than 90 days', () => {
    const txs = [tx(200, -50, 'consumption'), tx(120, -50, 'consumption'), tx(14, -1, 'consumption'), tx(7, -1, 'consumption')];
    const stats = computeConsumptionStats(txs, 2, NOW);
    expect(stats.status === 'ok' && stats.consumedTotal).toBe(2);
  });

  it('reports "no consumption" for items that were only bought', () => {
    expect(computeConsumptionStats([tx(30, 2, 'purchase')], 2, NOW)).toEqual({ status: 'no-consumption' });
  });

  it('forecasts 0 days left when the stock is already empty', () => {
    const stats = computeConsumptionStats([tx(14, -1, 'consumption'), tx(7, -1, 'consumption')], 0, NOW);
    expect(stats.status === 'ok' && stats.daysLeft).toBe(0);
  });
});

describe('consumptionStatsService.getForItems', () => {
  beforeEach(async () => {
    await db.transactions.clear();
  });

  it('groups transactions per item from one query', async () => {
    await db.transactions.bulkPut([
      tx(14, -2, 'consumption', 'a'), tx(7, -2, 'consumption', 'a'),
      tx(30, 1, 'purchase', 'b'),
    ]);
    const result = await consumptionStatsService.getForItems([{ id: 'a', quantity: 2 }, { id: 'b', quantity: 1 }, { id: 'c', quantity: 1 }], NOW);
    const a = result.get('a');
    // 4 consumed over 14 days, 2 left -> 7 days
    expect(a?.status === 'ok' && a.daysLeft).toBeCloseTo(7);
    expect(result.get('b')?.status).toBe('no-consumption');
    expect(result.get('c')?.status).toBe('insufficient-data');
  });
});
