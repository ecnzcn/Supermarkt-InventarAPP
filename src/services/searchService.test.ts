import { describe, expect, it } from 'vitest';
import { applySortOption, filterItems, searchItems, sortItems } from '@/services/searchService';
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

  it('filters by exact stock status: "Auf Lager"', () => {
    expect(filterItems(items, { stockStatus: 'ok' }).map((i) => i.name)).toEqual(['A']);
  });

  it('filters by exact stock status: "Fast leer"', () => {
    expect(filterItems(items, { stockStatus: 'low' }).map((i) => i.name)).toEqual(['B']);
  });

  it('filters by exact stock status: "Leer"', () => {
    expect(filterItems(items, { stockStatus: 'out' }).map((i) => i.name)).toEqual(['C']);
  });

  it('"all" stock status returns everything', () => {
    expect(filterItems(items, { stockStatus: 'all' })).toHaveLength(3);
  });

  it('combines category, location and favorites filters', () => {
    const cat = makeCategory('Backen');
    const loc = makeLocation('Keller');
    const combined: EnrichedItem[] = [
      makeItem({ name: 'Match', categoryId: cat.id, category: cat, locationId: loc.id, location: loc, isFavorite: true }),
      makeItem({ name: 'WrongCategory', categoryId: 'other', locationId: loc.id, location: loc, isFavorite: true }),
      makeItem({ name: 'NotFavorite', categoryId: cat.id, category: cat, locationId: loc.id, location: loc, isFavorite: false }),
    ];
    expect(
      filterItems(combined, { categoryId: cat.id, locationId: loc.id, favoritesOnly: true }).map((i) => i.name),
    ).toEqual(['Match']);
  });
});

describe('sortItems', () => {
  it('sorts by name ascending', () => {
    const items = [makeItem({ name: 'Zucker' }), makeItem({ name: 'Mehl' })];
    expect(sortItems(items, 'name').map((i) => i.name)).toEqual(['Mehl', 'Zucker']);
  });

  it('sorts by name descending', () => {
    const items = [makeItem({ name: 'Mehl' }), makeItem({ name: 'Zucker' })];
    expect(sortItems(items, 'name', 'desc').map((i) => i.name)).toEqual(['Zucker', 'Mehl']);
  });

  it('sorts by quantity ascending and descending', () => {
    const items = [makeItem({ name: 'High', quantity: 9 }), makeItem({ name: 'Low', quantity: 1 })];
    expect(sortItems(items, 'quantity', 'asc').map((i) => i.name)).toEqual(['Low', 'High']);
    expect(sortItems(items, 'quantity', 'desc').map((i) => i.name)).toEqual(['High', 'Low']);
  });

  it('sorts by stock status: out before low before ok', () => {
    const items = [
      makeItem({ name: 'ok-item', stockStatus: 'ok' }),
      makeItem({ name: 'out-item', stockStatus: 'out' }),
      makeItem({ name: 'low-item', stockStatus: 'low' }),
    ];
    expect(sortItems(items, 'stockStatus').map((i) => i.name)).toEqual(['out-item', 'low-item', 'ok-item']);
  });

  it('sorts favorites first', () => {
    const items = [
      makeItem({ name: 'NotFav', isFavorite: false }),
      makeItem({ name: 'Fav', isFavorite: true }),
    ];
    expect(sortItems(items, 'favorite').map((i) => i.name)).toEqual(['Fav', 'NotFav']);
  });
});

describe('applySortOption', () => {
  const items = [
    makeItem({ name: 'Zucker', quantity: 1, isFavorite: false, updatedAt: 100 }),
    makeItem({ name: 'Mehl', quantity: 9, isFavorite: true, updatedAt: 200 }),
  ];

  it('name-asc', () => {
    expect(applySortOption(items, 'name-asc').map((i) => i.name)).toEqual(['Mehl', 'Zucker']);
  });

  it('name-desc', () => {
    expect(applySortOption(items, 'name-desc').map((i) => i.name)).toEqual(['Zucker', 'Mehl']);
  });

  it('updatedAt-desc puts the most recently changed item first', () => {
    expect(applySortOption(items, 'updatedAt-desc').map((i) => i.name)).toEqual(['Mehl', 'Zucker']);
  });

  it('quantity-asc and quantity-desc', () => {
    expect(applySortOption(items, 'quantity-asc').map((i) => i.name)).toEqual(['Zucker', 'Mehl']);
    expect(applySortOption(items, 'quantity-desc').map((i) => i.name)).toEqual(['Mehl', 'Zucker']);
  });

  it('favorite puts favorites first', () => {
    expect(applySortOption(items, 'favorite').map((i) => i.name)).toEqual(['Mehl', 'Zucker']);
  });
});
