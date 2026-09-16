export type Id = string;

export type TransactionReason = 'purchase' | 'consumption' | 'adjustment';

export interface Category {
  id: Id;
  name: string;
  icon: string;
  parentId: Id | null;
  createdAt: number;
  updatedAt: number;
}

export interface Location {
  id: Id;
  name: string;
  parentId: Id | null;
  createdAt: number;
  updatedAt: number;
}

export interface Item {
  id: Id;
  name: string;
  categoryId: Id | null;
  locationId: Id | null;
  quantity: number;
  unit: string;
  minimumQuantity: number;
  isFavorite: boolean;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface InventoryTransaction {
  id: Id;
  itemId: Id;
  delta: number;
  previousQuantity: number;
  newQuantity: number;
  reason: TransactionReason;
  timestamp: number;
}

export interface Tag {
  id: Id;
  name: string;
}

export interface ItemTag {
  id: Id;
  itemId: Id;
  tagId: Id;
}

export type StockStatus = 'ok' | 'low' | 'out';

export function getStockStatus(item: Pick<Item, 'quantity' | 'minimumQuantity'>): StockStatus {
  if (item.quantity <= 0) return 'out';
  if (item.quantity <= item.minimumQuantity) return 'low';
  return 'ok';
}
