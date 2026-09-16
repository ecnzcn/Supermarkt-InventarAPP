export interface DefaultCategorySeed {
  name: string;
  icon: string;
}

export const DEFAULT_FOOD_CATEGORIES: DefaultCategorySeed[] = [
  { name: 'Backen', icon: '🧁' },
  { name: 'Konserven', icon: '🥫' },
  { name: 'Nudeln & Reis', icon: '🍝' },
  { name: 'Frühstück', icon: '🥣' },
  { name: 'Süßigkeiten', icon: '🍬' },
  { name: 'Getränke', icon: '🥤' },
  { name: 'Tiefkühl', icon: '🧊' },
  { name: 'Gewürze', icon: '🧂' },
  { name: 'Soßen', icon: '🍯' },
  { name: 'Sonstiges', icon: '📦' },
];

export const DEFAULT_HOUSEHOLD_CATEGORIES: DefaultCategorySeed[] = [
  { name: 'Waschmittel', icon: '🧴' },
  { name: 'Reinigung', icon: '🧽' },
  { name: 'Papierwaren', icon: '🧻' },
  { name: 'Spülen', icon: '🍽️' },
  { name: 'Müllbeutel', icon: '🗑️' },
  { name: 'Körperpflege', icon: '🧼' },
  { name: 'Sonstiges', icon: '📦' },
];

export const DEFAULT_LOCATIONS: string[] = ['Küche', 'Keller', 'Speisekammer', 'Bad'];
