import { categoryRepository } from '@/repositories/categoryRepository';
import { locationRepository } from '@/repositories/locationRepository';
import { itemRepository } from '@/repositories/itemRepository';
import { inventoryService } from '@/services/inventoryService';
import { seedDefaultsIfEmpty } from '@/db/seed';

interface DemoItemSeed {
  name: string;
  categoryName: string;
  locationName: string;
  quantity: number;
  unit: string;
  minimumQuantity: number;
}

const DEMO_ITEMS: DemoItemSeed[] = [
  { name: 'Mehl', categoryName: 'Backen', locationName: 'Speisekammer', quantity: 4, unit: 'Packungen', minimumQuantity: 1 },
  { name: 'Zucker', categoryName: 'Backen', locationName: 'Speisekammer', quantity: 2, unit: 'Packungen', minimumQuantity: 1 },
  { name: 'Salz', categoryName: 'Gewürze', locationName: 'Speisekammer', quantity: 1, unit: 'Packung', minimumQuantity: 1 },
  { name: 'Nudeln', categoryName: 'Nudeln & Reis', locationName: 'Speisekammer', quantity: 5, unit: 'Packungen', minimumQuantity: 2 },
  { name: 'Reis', categoryName: 'Nudeln & Reis', locationName: 'Speisekammer', quantity: 3, unit: 'Packungen', minimumQuantity: 1 },
  { name: 'Tomatensauce', categoryName: 'Soßen', locationName: 'Speisekammer', quantity: 2, unit: 'Gläser', minimumQuantity: 1 },
  { name: 'Kaffee', categoryName: 'Getränke', locationName: 'Küche', quantity: 1, unit: 'Packung', minimumQuantity: 1 },
  { name: 'Tee', categoryName: 'Getränke', locationName: 'Küche', quantity: 2, unit: 'Packungen', minimumQuantity: 1 },
  { name: 'Waschmittel', categoryName: 'Waschmittel', locationName: 'Keller', quantity: 1, unit: 'Flasche', minimumQuantity: 1 },
  { name: 'Spülmittel', categoryName: 'Spülen', locationName: 'Küche', quantity: 1, unit: 'Flasche', minimumQuantity: 1 },
  { name: 'Spülmaschinentabs', categoryName: 'Spülen', locationName: 'Küche', quantity: 1, unit: 'Packung', minimumQuantity: 1 },
  { name: 'Küchenrolle', categoryName: 'Papierwaren', locationName: 'Küche', quantity: 3, unit: 'Packungen', minimumQuantity: 1 },
  { name: 'Toilettenpapier', categoryName: 'Papierwaren', locationName: 'Bad', quantity: 8, unit: 'Rollen', minimumQuantity: 4 },
  { name: 'Müllbeutel', categoryName: 'Müllbeutel', locationName: 'Küche', quantity: 1, unit: 'Packung', minimumQuantity: 1 },
];

export interface SeedDemoItemsResult {
  created: number;
  skippedExisting: number;
}

/**
 * Creates a realistic set of demo items for exercising the UI, skipping any
 * name that already exists so the action is safe to trigger more than once.
 */
export async function seedDemoItems(): Promise<SeedDemoItemsResult> {
  await seedDefaultsIfEmpty();

  const [categories, locations, existingItems] = await Promise.all([
    categoryRepository.getAll(),
    locationRepository.getAll(),
    itemRepository.getAll(),
  ]);

  const categoryIdByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
  const locationIdByName = new Map(locations.map((l) => [l.name.toLowerCase(), l.id]));
  const existingNames = new Set(existingItems.map((i) => i.name.toLowerCase()));

  let created = 0;
  let skippedExisting = 0;

  for (const seed of DEMO_ITEMS) {
    if (existingNames.has(seed.name.toLowerCase())) {
      skippedExisting += 1;
      continue;
    }
    await inventoryService.createItem({
      name: seed.name,
      categoryId: categoryIdByName.get(seed.categoryName.toLowerCase()) ?? null,
      locationId: locationIdByName.get(seed.locationName.toLowerCase()) ?? null,
      quantity: seed.quantity,
      unit: seed.unit,
      minimumQuantity: seed.minimumQuantity,
    });
    created += 1;
  }

  return { created, skippedExisting };
}
