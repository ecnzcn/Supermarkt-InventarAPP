import type { Category, Item, Location, StockStatus, Tag } from '@/types/models';

export interface EnrichedItem extends Item {
  category: Category | null;
  location: Location | null;
  tags: Tag[];
  stockStatus: StockStatus;
}
