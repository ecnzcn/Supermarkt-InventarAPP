import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEnrichedItems } from '@/hooks/useEnrichedItems';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';
import { ItemCard } from '@/components/ItemCard';
import { filterItems, searchItems, sortItems, type SortKey } from '@/services/searchService';

type StockFilter = 'all' | 'low';

export function InventoryPage() {
  const items = useEnrichedItems();
  const categories = useCategories();
  const locations = useLocations();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');

  const visibleItems = useMemo(() => {
    if (!items) return [];
    const filtered = filterItems(items, {
      categoryId,
      locationId,
      lowStockOnly: stockFilter === 'low',
    });
    const searched = searchItems(filtered, query);
    return sortItems(searched, sortKey, 'asc');
  }, [items, query, categoryId, locationId, stockFilter, sortKey]);

  return (
    <div>
      <h1 className="page-title">Inventar</h1>

      <div className="search-bar">
        <input
          type="search"
          placeholder="Suchen nach Name, Kategorie, Ort, Tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Inventar durchsuchen"
        />
      </div>

      <div className="filter-chips" role="group" aria-label="Filter">
        <button
          type="button"
          className={`filter-chip${stockFilter === 'all' ? ' filter-chip--active' : ''}`}
          onClick={() => setStockFilter('all')}
        >
          Alle
        </button>
        <button
          type="button"
          className={`filter-chip${stockFilter === 'low' ? ' filter-chip--active' : ''}`}
          onClick={() => setStockFilter('low')}
        >
          Niedriger Bestand
        </button>
        {categories?.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`filter-chip${categoryId === category.id ? ' filter-chip--active' : ''}`}
            onClick={() => setCategoryId(categoryId === category.id ? null : category.id)}
          >
            {category.icon} {category.name}
          </button>
        ))}
        {locations?.map((location) => (
          <button
            key={location.id}
            type="button"
            className={`filter-chip${locationId === location.id ? ' filter-chip--active' : ''}`}
            onClick={() => setLocationId(locationId === location.id ? null : location.id)}
          >
            📍 {location.name}
          </button>
        ))}
      </div>

      <div className="form-field" style={{ maxWidth: 220 }}>
        <label htmlFor="sort-select">Sortieren nach</label>
        <select id="sort-select" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="name">Name</option>
          <option value="quantity">Menge</option>
          <option value="stockStatus">Bestand</option>
          <option value="updatedAt">Zuletzt geändert</option>
        </select>
      </div>

      {items === undefined ? (
        <p>Lädt…</p>
      ) : visibleItems.length === 0 ? (
        <div className="empty-state">
          <p>Keine Artikel gefunden.</p>
          <Link to="/inventory/new" className="button button--primary">
            Artikel hinzufügen
          </Link>
        </div>
      ) : (
        <div>
          {visibleItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <Link to="/inventory/new" className="button button--primary button--fab" aria-label="Neuen Artikel hinzufügen">
        +
      </Link>
    </div>
  );
}
