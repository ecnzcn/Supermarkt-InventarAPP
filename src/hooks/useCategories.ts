import { useLiveQuery } from 'dexie-react-hooks';
import { categoryRepository } from '@/repositories/categoryRepository';
import type { Category } from '@/types/models';

export function useCategories(): Category[] | undefined {
  return useLiveQuery(() => categoryRepository.getAll(), []);
}
