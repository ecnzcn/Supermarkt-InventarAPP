import type { EnrichedItem } from '@/types/views';
import type { StockStatus } from '@/types/models';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function searchItems(items: EnrichedItem[], query: string): EnrichedItem[] {
  const needle = normalize(query);
  if (!needle) return items;

  return items.filter((item) => {
    const haystacks = [
      item.name,
      item.category?.name ?? '',
      item.location?.name ?? '',
      ...item.tags.map((tag) => tag.name),
    ];
    return haystacks.some((value) => normalize(value).includes(needle));
  });
}

export type SortKey = 'name' | 'quantity' | 'updatedAt' | 'stockStatus' | 'favorite';
export type SortDirection = 'asc' | 'desc';

const stockOrder: Record<EnrichedItem['stockStatus'], number> = { out: 0, low: 1, ok: 2 };

export function sortItems(items: EnrichedItem[], key: SortKey, direction: SortDirection = 'asc'): EnrichedItem[] {
  const sorted = [...items].sort((a, b) => {
    switch (key) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'quantity':
        return a.quantity - b.quantity;
      case 'updatedAt':
        return a.updatedAt - b.updatedAt;
      case 'stockStatus':
        return stockOrder[a.stockStatus] - stockOrder[b.stockStatus];
      case 'favorite':
        return Number(b.isFavorite) - Number(a.isFavorite);
      default:
        return 0;
    }
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}

/** Options presented to the user, mapped 1:1 to a (key, direction) pair. */
export type SortOption = 'name-asc' | 'name-desc' | 'updatedAt-desc' | 'quantity-asc' | 'quantity-desc' | 'favorite';

export const SORT_OPTION_LABELS: Record<SortOption, string> = {
  'name-asc': 'Name A–Z',
  'name-desc': 'Name Z–A',
  'updatedAt-desc': 'Zuletzt geändert',
  'quantity-asc': 'Bestand niedrig → hoch',
  'quantity-desc': 'Bestand hoch → niedrig',
  favorite: 'Favoriten zuerst',
};

export function applySortOption(items: EnrichedItem[], option: SortOption): EnrichedItem[] {
  switch (option) {
    case 'name-asc':
      return sortItems(items, 'name', 'asc');
    case 'name-desc':
      return sortItems(items, 'name', 'desc');
    case 'updatedAt-desc':
      return sortItems(items, 'updatedAt', 'desc');
    case 'quantity-asc':
      return sortItems(items, 'quantity', 'asc');
    case 'quantity-desc':
      return sortItems(items, 'quantity', 'desc');
    case 'favorite':
      return sortItems(items, 'favorite', 'asc');
    default:
      return items;
  }
}

export type StockFilterValue = 'all' | StockStatus;

export interface ItemFilters {
  categoryId?: string | null;
  locationId?: string | null;
  favoritesOnly?: boolean;
  stockStatus?: StockFilterValue;
}

export function filterItems(items: EnrichedItem[], filters: ItemFilters): EnrichedItem[] {
  return items.filter((item) => {
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
    if (filters.locationId && item.locationId !== filters.locationId) return false;
    if (filters.favoritesOnly && !item.isFavorite) return false;
    if (filters.stockStatus && filters.stockStatus !== 'all' && item.stockStatus !== filters.stockStatus) return false;
    return true;
  });
}
