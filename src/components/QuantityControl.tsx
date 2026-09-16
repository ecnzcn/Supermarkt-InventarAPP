import { useRef, useState } from 'react';
import { inventoryService } from '@/services/inventoryService';
import { useUndoToast } from '@/features/undo/UndoToastContext';

interface QuantityControlProps {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
}

export function QuantityControl({ itemId, itemName, quantity, unit }: QuantityControlProps) {
  const { showUndo, showError } = useUndoToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(quantity));
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function applyDelta(delta: number, reason: 'purchase' | 'consumption') {
    if (delta < 0 && quantity <= 0) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return;
    }
    try {
      const { transaction } = await inventoryService.adjustQuantity(itemId, delta, reason);
      showUndo(`${itemName}: ${transaction.previousQuantity} → ${transaction.newQuantity} ${unit}`, transaction.id);
    } catch (error) {
      showError(`Menge konnte nicht geändert werden: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function startEditing() {
    setDraft(String(quantity));
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }

  async function commitEdit() {
    setEditing(false);
    const parsed = Number(draft.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed === quantity) return;
    try {
      const { transaction } = await inventoryService.setQuantity(itemId, parsed);
      showUndo(`${itemName}: ${transaction.previousQuantity} → ${transaction.newQuantity} ${unit}`, transaction.id);
    } catch (error) {
      showError(`Menge konnte nicht geändert werden: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <div className={`quantity-control${shake ? ' quantity-control--shake' : ''}`}>
      <button
        type="button"
        className="quantity-control__button"
        aria-label={`${itemName}: Menge verringern`}
        onClick={() => applyDelta(-1, 'consumption')}
      >
        −
      </button>
      {editing ? (
        <input
          ref={inputRef}
          className="quantity-control__value"
          type="number"
          inputMode="decimal"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') inputRef.current?.blur();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <button
          type="button"
          className="quantity-control__value"
          aria-label={`${itemName}: Menge bearbeiten, aktuell ${quantity} ${unit}`}
          onClick={startEditing}
        >
          {quantity}
        </button>
      )}
      <button
        type="button"
        className="quantity-control__button"
        aria-label={`${itemName}: Menge erhöhen`}
        onClick={() => applyDelta(1, 'purchase')}
      >
        +
      </button>
    </div>
  );
}
