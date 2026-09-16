import type { EnrichedItem } from '@/types/views';

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

export type SortKey = 'name' | 'quantity' | 'updatedAt' | 'stockStatus';
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
      default:
        return 0;
    }
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}

export interface ItemFilters {
  categoryId?: string | null;
  locationId?: string | null;
  favoritesOnly?: boolean;
  lowStockOnly?: boolean;
}

export function filterItems(items: EnrichedItem[], filters: ItemFilters): EnrichedItem[] {
  return items.filter((item) => {
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
    if (filters.locationId && item.locationId !== filters.locationId) return false;
    if (filters.favoritesOnly && !item.isFavorite) return false;
    if (filters.lowStockOnly && item.stockStatus === 'ok') return false;
    return true;
  });
}
