import { describe, expect, it } from 'vitest';
import { filterItems, searchItems, sortItems } from '@/services/searchService';
import type { EnrichedItem } from '@/types/views';
import type { Category, Location } from '@/types/models';

function makeCategory(name: string): Category {
  return { id: `cat-${name}`, name, icon: '📦', parentId: null, createdAt: 0, updatedAt: 0 };
}
function makeLocation(name: string): Location {
  return { id: `loc-${name}`, name, parentId: null, createdAt: 0, updatedAt: 0 };
}

function makeItem(overrides: Partial<EnrichedItem> = {}): EnrichedItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: 'Mehl',
    categoryId: null,
    locationId: null,
    quantity: 4,
    unit: 'Packungen',
    minimumQuantity: 1,
    isFavorite: false,
    notes: '',
    createdAt: 0,
    updatedAt: 0,
    category: null,
    location: null,
    tags: [],
    stockStatus: 'ok',
    ...overrides,
  };
}

describe('searchItems', () => {
  const baking = makeCategory('Backen');
  const basement = makeLocation('Keller');

  const items: EnrichedItem[] = [
    makeItem({ name: 'Mehl', category: baking, location: basement }),
    makeItem({ name: 'Waschmittel', location: basement, tags: [{ id: 't1', name: 'Öko' }] }),
    makeItem({ name: 'Kaffee' }),
  ];

  it('matches by item name', () => {
    expect(searchItems(items, 'mehl').map((i) => i.name)).toEqual(['Mehl']);
  });

  it('matches by category name', () => {
    expect(searchItems(items, 'backen').map((i) => i.name)).toEqual(['Mehl']);
  });

  it('matches by location name', () => {
    const result = searchItems(items, 'keller').map((i) => i.name).sort();
    expect(result).toEqual(['Mehl', 'Waschmittel']);
  });

  it('matches by tag name', () => {
    expect(searchItems(items, 'öko').map((i) => i.name)).toEqual(['Waschmittel']);
  });

  it('returns all items for an empty query', () => {
    expect(searchItems(items, '')).toHaveLength(3);
  });

  it('is case-insensitive', () => {
    expect(searchItems(items, 'MEHL').map((i) => i.name)).toEqual(['Mehl']);
  });
});

describe('filterItems', () => {
  const items: EnrichedItem[] = [
    makeItem({ name: 'A', isFavorite: true, stockStatus: 'ok' }),
    makeItem({ name: 'B', isFavorite: false, stockStatus: 'low' }),
    makeItem({ name: 'C', isFavorite: false, stockStatus: 'out' }),
  ];

  it('filters favorites only', () => {
    expect(filterItems(items, { favoritesOnly: true }).map((i) => i.name)).toEqual(['A']);
  });

  it('filters low stock only (includes out of stock)', () => {
    expect(filterItems(items, { lowStockOnly: true }).map((i) => i.name).sort()).toEqual(['B', 'C']);
  });
});

describe('sortItems', () => {
  it('sorts by name ascending', () => {
    const items = [makeItem({ name: 'Zucker' }), makeItem({ name: 'Mehl' })];
    expect(sortItems(items, 'name').map((i) => i.name)).toEqual(['Mehl', 'Zucker']);
  });

  it('sorts by stock status: out before low before ok', () => {
    const items = [
      makeItem({ name: 'ok-item', stockStatus: 'ok' }),
      makeItem({ name: 'out-item', stockStatus: 'out' }),
      makeItem({ name: 'low-item', stockStatus: 'low' }),
    ];
    expect(sortItems(items, 'stockStatus').map((i) => i.name)).toEqual(['out-item', 'low-item', 'ok-item']);
  });
});
