import Dexie, { type Table } from 'dexie';
import type { Category, InventoryTransaction, Item, ItemTag, Location, Tag } from '@/types/models';

export class VorratDatabase extends Dexie {
  items!: Table<Item, string>;
  categories!: Table<Category, string>;
  locations!: Table<Location, string>;
  transactions!: Table<InventoryTransaction, string>;
  tags!: Table<Tag, string>;
  itemTags!: Table<ItemTag, string>;

  constructor() {
    super('vorrat-db');

    this.version(1).stores({
      items: 'id, name, categoryId, locationId, quantity, updatedAt',
      categories: 'id, name, parentId',
      locations: 'id, name, parentId',
      transactions: 'id, itemId, timestamp',
      tags: 'id, name',
      itemTags: 'id, itemId, tagId, [itemId+tagId]',
    });
  }
}

export const db = new VorratDatabase();
