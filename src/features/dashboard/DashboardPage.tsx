import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEnrichedItems } from '@/hooks/useEnrichedItems';
import { ItemCard } from '@/components/ItemCard';
import { useConsumptionForecasts } from '@/hooks/useConsumptionStats';
import { formatDuration } from '@/utils/formatConsumption';
import { BackupReminderCard } from '@/features/data-safety/BackupReminderCard';

/** Items still above their minimum but forecast to run out within this many days. */
export const RUNNING_OUT_DAYS = 14;

export function DashboardPage() {
  const items = useEnrichedItems();

  const { favorites, lowStock, outOfStock, totalItems } = useMemo(() => {
    const list = items ?? [];
    return {
      favorites: list.filter((i) => i.isFavorite),
      lowStock: list.filter((i) => i.stockStatus === 'low'),
      outOfStock: list.filter((i) => i.stockStatus === 'out'),
      totalItems: list.length,
    };
  }, [items]);

  const attention = [...outOfStock, ...lowStock].slice(0, 6);

  const forecasts = useConsumptionForecasts(items);
  const runningOut = useMemo(() => {
    if (!items || !forecasts) return [];
    return items
      .filter((i) => i.stockStatus === 'ok')
      .map((item) => ({ item, stats: forecasts.get(item.id) }))
      .flatMap(({ item, stats }) =>
        stats?.status === 'ok' && stats.daysLeft <= RUNNING_OUT_DAYS ? [{ item, daysLeft: stats.daysLeft }] : [],
      )
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 6);
  }, [items, forecasts]);

  return (
    <div>
      <h1 className="page-title">Übersicht</h1>

      <BackupReminderCard itemCount={totalItems} />

      <div className="dashboard-stat-grid">
        <div className="dashboard-stat">
          <div className="dashboard-stat__value">{totalItems}</div>
          <div className="dashboard-stat__label">Artikel im Inventar</div>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat__value">{lowStock.length + outOfStock.length}</div>
          <div className="dashboard-stat__label">Niedriger Bestand</div>
        </div>
      </div>

      {favorites.length > 0 && (
        <>
          <div className="section-title">Favoriten</div>
          {favorites.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </>
      )}

      {attention.length > 0 && (
        <>
          <div className="section-title">Bald aufbrauchen</div>
          {attention.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </>
      )}

      {runningOut.length > 0 && (
        <>
          <div className="section-title">Geht bald aus</div>
          {runningOut.map(({ item, daysLeft }) => (
            <ItemCard key={item.id} item={item} hint={`Noch ${formatDuration(daysLeft)}`} />
          ))}
        </>
      )}

      {items !== undefined && totalItems === 0 && (
        <div className="empty-state">
          <p>Noch keine Artikel im Inventar.</p>
          <Link to="/inventory/new" className="button button--primary">
            Ersten Artikel hinzufügen
          </Link>
        </div>
      )}

      {items !== undefined && totalItems > 0 && favorites.length === 0 && attention.length === 0 && runningOut.length === 0 && (
        <div className="empty-state">
          <p>Alles im grünen Bereich. 👍</p>
        </div>
      )}
    </div>
  );
}
