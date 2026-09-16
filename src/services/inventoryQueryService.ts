import { itemRepository } from '@/repositories/itemRepository';
import { categoryRepository } from '@/repositories/categoryRepository';
import { locationRepository } from '@/repositories/locationRepository';
import { tagRepository } from '@/repositories/tagRepository';
import { getStockStatus } from '@/types/models';
import type { EnrichedItem } from '@/types/views';

export const inventoryQueryService = {
  async getEnrichedItems(): Promise<EnrichedItem[]> {
    const [items, categories, locations] = await Promise.all([
      itemRepository.getAll(),
      categoryRepository.getAll(),
      locationRepository.getAll(),
    ]);
    const tagsByItem = await tagRepository.getTagsForItems(items.map((i) => i.id));

    const categoriesById = new Map(categories.map((c) => [c.id, c]));
    const locationsById = new Map(locations.map((l) => [l.id, l]));

    return items.map((item) => ({
      ...item,
      category: item.categoryId ? categoriesById.get(item.categoryId) ?? null : null,
      location: item.locationId ? locationsById.get(item.locationId) ?? null : null,
      tags: tagsByItem.get(item.id) ?? [],
      stockStatus: getStockStatus(item),
    }));
  },
};
