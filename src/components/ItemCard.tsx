import { Link } from 'react-router-dom';
import { QuantityControl } from '@/components/QuantityControl';
import { inventoryService } from '@/services/inventoryService';
import { useUndoToast } from '@/features/undo/UndoToastContext';
import type { EnrichedItem } from '@/types/views';

interface ItemCardProps {
  item: EnrichedItem;
}

export function ItemCard({ item }: ItemCardProps) {
  const { showError } = useUndoToast();
  const metaParts = [item.category?.name, item.location?.name].filter(Boolean);

  async function handleToggleFavorite() {
    try {
      await inventoryService.toggleFavorite(item.id);
    } catch (error) {
      showError(`Favorit konnte nicht geändert werden: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <div className="item-card">
      <div className="item-card__info">
        <Link to={`/inventory/${item.id}/edit`} className="item-card__name">
          {item.stockStatus !== 'ok' && (
            <span
              className={`item-card__stock-badge item-card__stock-badge--${item.stockStatus}`}
              aria-label={item.stockStatus === 'out' ? 'Nicht vorrätig' : 'Niedriger Bestand'}
              title={item.stockStatus === 'out' ? 'Nicht vorrätig' : 'Niedriger Bestand'}
            />
          )}
          <span>{item.name}</span>
        </Link>
        {metaParts.length > 0 && <div className="item-card__meta">{metaParts.join(' · ')}</div>}
      </div>
      <button
        type="button"
        className="favorite-toggle"
        aria-label={item.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
        onClick={handleToggleFavorite}
      >
        {item.isFavorite ? '⭐' : '☆'}
      </button>
      <QuantityControl itemId={item.id} itemName={item.name} quantity={item.quantity} unit={item.unit} />
    </div>
  );
}
