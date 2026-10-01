import type { ConsumptionStats } from '@/services/consumptionStatsService';
import { MIN_SPAN_DAYS } from '@/services/consumptionStatsService';
import { formatAmount, formatDate, formatDuration } from '@/utils/formatConsumption';

interface ConsumptionStatsCardProps {
  stats: ConsumptionStats | undefined;
  unit: string;
}

export function ConsumptionStatsCard({ stats, unit }: ConsumptionStatsCardProps) {
  if (stats === undefined) return null;
  const u = unit.trim();
  const withUnit = (value: number) => (u ? `${formatAmount(value)} ${u}` : formatAmount(value));

  if (stats.status === 'no-consumption') {
    return <p className="consumption__hint">In den letzten 90 Tagen nichts verbraucht.</p>;
  }

  if (stats.status === 'insufficient-data') {
    return (
      <p className="consumption__hint">
        Noch zu wenig Daten für eine Prognose. Sobald du über mindestens {MIN_SPAN_DAYS} Tage ein paar Mal mit „−“
        verbrauchst, erscheint hier, wie lange der Vorrat reicht.
      </p>
    );
  }

  const empty = stats.daysLeft <= 0;

  return (
    <div className="consumption">
      <div className="consumption__grid">
        <div className="consumption__stat">
          <div className="consumption__value">{withUnit(stats.perWeek)}</div>
          <div className="consumption__label">pro Woche</div>
        </div>
        <div className="consumption__stat">
          <div className="consumption__value">{withUnit(stats.perMonth)}</div>
          <div className="consumption__label">pro Monat</div>
        </div>
      </div>
      <p className={`consumption__forecast${!empty && stats.daysLeft <= 7 ? ' consumption__forecast--soon' : ''}`}>
        {empty
          ? 'Aufgebraucht – Zeit zum Nachkaufen.'
          : `Reicht noch ${formatDuration(stats.daysLeft)} (bis ca. ${formatDate(stats.emptyOn)}).`}
      </p>
      <p className="consumption__hint">
        Basis: {withUnit(stats.consumedTotal)} verbraucht in den letzten {Math.round(stats.periodDays)} Tagen.
      </p>
    </div>
  );
}
