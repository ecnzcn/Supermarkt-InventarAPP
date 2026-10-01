import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConsumptionStatsCard } from './ConsumptionStatsCard';
import { DAY_MS } from '@/services/consumptionStatsService';

const base = { status: 'ok' as const, consumedTotal: 14, periodDays: 28, perDay: 0.5, perWeek: 3.5, perMonth: 15 };

describe('ConsumptionStatsCard', () => {
  it('shows weekly/monthly usage and the forecast with unit', () => {
    render(<ConsumptionStatsCard unit="Packungen" stats={{ ...base, daysLeft: 21, emptyOn: Date.UTC(2026, 9, 22) }} />);
    expect(screen.getByText('3,5 Packungen')).toBeInTheDocument();
    expect(screen.getByText('15 Packungen')).toBeInTheDocument();
    expect(screen.getByText('Reicht noch ca. 3 Wochen (bis ca. 22.10.2026).')).toBeInTheDocument();
    expect(screen.getByText('Basis: 14 Packungen verbraucht in den letzten 28 Tagen.')).toBeInTheDocument();
  });

  it('highlights a forecast of a week or less', () => {
    render(<ConsumptionStatsCard unit="Stk." stats={{ ...base, daysLeft: 3, emptyOn: Date.now() + 3 * DAY_MS }} />);
    expect(screen.getByText(/Reicht noch ca\. 3 Tage/)).toHaveClass('consumption__forecast--soon');
  });

  it('explains when there is not enough data yet', () => {
    render(<ConsumptionStatsCard unit="Stk." stats={{ status: 'insufficient-data', consumedTotal: 1 }} />);
    expect(screen.getByText(/Noch zu wenig Daten/)).toBeInTheDocument();
  });

  it('says when nothing was consumed', () => {
    render(<ConsumptionStatsCard unit="Stk." stats={{ status: 'no-consumption' }} />);
    expect(screen.getByText('In den letzten 90 Tagen nichts verbraucht.')).toBeInTheDocument();
  });
});
