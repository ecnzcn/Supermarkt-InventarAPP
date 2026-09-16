import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEnrichedItems } from '@/hooks/useEnrichedItems';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';
import { ItemCard } from '@/components/ItemCard';
import {
  applySortOption,
  filterItems,
  searchItems,
  SORT_OPTION_LABELS,
  type SortOption,
  type StockFilterValue,
} from '@/services/searchService';

const STOCK_FILTER_LABELS: Record<StockFilterValue, string> = {
  all: 'Alle',
  ok: 'Auf Lager',
  low: 'Fast leer',
  out: 'Leer',
};

const STOCK_FILTER_ORDER: StockFilterValue[] = ['all', 'ok', 'low', 'out'];

export function InventoryPage() {
  const items = useEnrichedItems();
  const categories = useCategories();
  const locations = useLocations();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<StockFilterValue>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');

  const visibleItems = useMemo(() => {
    if (!items) return [];
    const filtered = filterItems(items, {
      categoryId,
      locationId,
      favoritesOnly,
      stockStatus: stockFilter,
    });
    const searched = searchItems(filtered, query);
    return applySortOption(searched, sortOption);
  }, [items, query, categoryId, locationId, stockFilter, favoritesOnly, sortOption]);

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

      <div className="filter-chips" role="group" aria-label="Lagerstatus">
        {STOCK_FILTER_ORDER.map((value) => (
          <button
            key={value}
            type="button"
            className={`filter-chip${stockFilter === value ? ' filter-chip--active' : ''}`}
            onClick={() => setStockFilter(value)}
          >
            {STOCK_FILTER_LABELS[value]}
          </button>
        ))}
        <button
          type="button"
          className={`filter-chip${favoritesOnly ? ' filter-chip--active' : ''}`}
          onClick={() => setFavoritesOnly((v) => !v)}
        >
          ⭐ Favoriten
        </button>
      </div>

      {(categories && categories.length > 0) || (locations && locations.length > 0) ? (
        <div className="filter-chips" role="group" aria-label="Kategorie und Ort">
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
      ) : null}

      <div className="form-field" style={{ maxWidth: 220 }}>
        <label htmlFor="sort-select">Sortieren nach</label>
        <select id="sort-select" value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)}>
          {Object.entries(SORT_OPTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
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
