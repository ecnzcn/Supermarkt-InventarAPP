import { db } from '@/db/database';
import type { ItemTag, Tag } from '@/types/models';

export const tagRepository = {
  async getAll(): Promise<Tag[]> {
    return db.tags.toArray();
  },

  async create(tag: Tag): Promise<void> {
    await db.tags.add(tag);
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.tags, db.itemTags, async () => {
      await db.tags.delete(id);
      await db.itemTags.where('tagId').equals(id).delete();
    });
  },

  async getTagsForItem(itemId: string): Promise<Tag[]> {
    const links = await db.itemTags.where('itemId').equals(itemId).toArray();
    const tagIds = links.map((link) => link.tagId);
    if (tagIds.length === 0) return [];
    return db.tags.where('id').anyOf(tagIds).toArray();
  },

  async getTagsForItems(itemIds: string[]): Promise<Map<string, Tag[]>> {
    if (itemIds.length === 0) return new Map();
    const links = await db.itemTags.where('itemId').anyOf(itemIds).toArray();
    const allTags = await db.tags.toArray();
    const tagsById = new Map(allTags.map((tag) => [tag.id, tag]));
    const result = new Map<string, Tag[]>();
    for (const link of links) {
      const tag = tagsById.get(link.tagId);
      if (!tag) continue;
      const list = result.get(link.itemId) ?? [];
      list.push(tag);
      result.set(link.itemId, list);
    }
    return result;
  },

  async setTagsForItem(itemId: string, tagIds: string[]): Promise<void> {
    await db.transaction('rw', db.itemTags, async () => {
      await db.itemTags.where('itemId').equals(itemId).delete();
      const links: ItemTag[] = tagIds.map((tagId) => ({
        id: crypto.randomUUID(),
        itemId,
        tagId,
      }));
      if (links.length > 0) await db.itemTags.bulkAdd(links);
    });
  },

  async bulkPutTags(tags: Tag[]): Promise<void> {
    await db.tags.bulkPut(tags);
  },

  async bulkPutItemTags(itemTags: ItemTag[]): Promise<void> {
    await db.itemTags.bulkPut(itemTags);
  },

  async count(): Promise<number> {
    return db.tags.count();
  },
};
