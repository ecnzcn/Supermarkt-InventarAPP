import { useLiveQuery } from 'dexie-react-hooks';
import { tagRepository } from '@/repositories/tagRepository';
import type { Tag } from '@/types/models';

export function useTags(): Tag[] | undefined {
  return useLiveQuery(() => tagRepository.getAll(), []);
}
