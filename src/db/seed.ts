import { categoryRepository } from '@/repositories/categoryRepository';
import { locationRepository } from '@/repositories/locationRepository';
import { DEFAULT_FOOD_CATEGORIES, DEFAULT_HOUSEHOLD_CATEGORIES, DEFAULT_LOCATIONS } from '@/db/defaultCategories';
import type { Category, Location } from '@/types/models';

function makeCategory(name: string, icon: string, parentId: string | null): Category {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    icon,
    parentId,
    createdAt: now,
    updatedAt: now,
  };
}

function makeLocation(name: string): Location {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    parentId: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function seedDefaultsIfEmpty(): Promise<void> {
  const [categoryCount, locationCount] = await Promise.all([
    categoryRepository.count(),
    locationRepository.count(),
  ]);

  if (categoryCount === 0) {
    const categories = [
      ...DEFAULT_FOOD_CATEGORIES.map((c) => makeCategory(c.name, c.icon, null)),
      ...DEFAULT_HOUSEHOLD_CATEGORIES.map((c) => makeCategory(c.name, c.icon, null)),
    ];
    await categoryRepository.bulkPut(categories);
  }

  if (locationCount === 0) {
    const locations = DEFAULT_LOCATIONS.map((name) => makeLocation(name));
    await locationRepository.bulkPut(locations);
  }
}
