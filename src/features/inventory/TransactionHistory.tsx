import { useLiveQuery } from 'dexie-react-hooks';
import { transactionRepository } from '@/repositories/transactionRepository';
import { formatTransactionTimestamp } from '@/utils/formatRelativeDate';

interface TransactionHistoryProps {
  itemId: string;
}

const REASON_LABELS: Record<string, string> = {
  purchase: 'Gekauft',
  consumption: 'Verbraucht',
  adjustment: 'Angepasst',
};

export function TransactionHistory({ itemId }: TransactionHistoryProps) {
  const transactions = useLiveQuery(() => transactionRepository.getByItemId(itemId), [itemId]);

  if (transactions === undefined) return null;
  if (transactions.length === 0) {
    return <p className="transaction-history__empty">Noch keine Änderungen erfasst.</p>;
  }

  return (
    <ul className="transaction-history">
      {transactions.map((tx) => (
        <li key={tx.id} className="transaction-history__row">
          <span className="transaction-history__time">{formatTransactionTimestamp(tx.timestamp)}</span>
          <span className="transaction-history__reason">{REASON_LABELS[tx.reason] ?? tx.reason}</span>
          <span className={`transaction-history__delta${tx.delta < 0 ? ' transaction-history__delta--negative' : tx.delta > 0 ? ' transaction-history__delta--positive' : ''}`}>
            {tx.delta > 0 ? `+${tx.delta}` : tx.delta}
          </span>
        </li>
      ))}
    </ul>
  );
}
