export interface UnitGroup {
  label: string;
  units: string[];
}

/** Predefined units offered in the item form. Custom units remain possible. */
export const UNIT_GROUPS: UnitGroup[] = [
  {
    label: 'Stückzahl',
    units: ['Stk.', 'Packung', 'Packungen', 'Flasche', 'Flaschen', 'Dose', 'Dosen', 'Glas', 'Gläser', 'Beutel', 'Rolle', 'Rollen', 'Tube', 'Tuben', 'Karton', 'Kartons', 'Tafel', 'Tafeln'],
  },
  {
    label: 'Gewicht & Volumen',
    units: ['g', 'kg', 'ml', 'l'],
  },
];

export const PREDEFINED_UNITS: string[] = UNIT_GROUPS.flatMap((g) => g.units);
export const DEFAULT_UNIT = 'Stk.';
