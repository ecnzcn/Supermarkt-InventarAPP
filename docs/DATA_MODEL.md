# Datenmodell – Vorrat

Alle Modelle liegen in `src/types/models.ts`. Persistiert werden sie 1:1 als
Dexie/IndexedDB-Tabellen (`src/db/database.ts`, Schema-Version 1).

## Item

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | `string` (UUID) | Primärschlüssel |
| `name` | `string` | Pflichtfeld, einziges zwingend erforderliches Feld |
| `categoryId` | `string \| null` | Fremdschlüssel auf `Category` |
| `locationId` | `string \| null` | Fremdschlüssel auf `Location` |
| `quantity` | `number` | Aktueller Bestand, niemals negativ |
| `unit` | `string` | z. B. „Packungen“, „Flaschen“, „Stk.“ |
| `minimumQuantity` | `number` | Schwelle für „Fast leer“ |
| `isFavorite` | `boolean` | Für Dashboard-Priorisierung |
| `notes` | `string` | Freitext |
| `createdAt` / `updatedAt` | `number` (ms epoch) | Zeitstempel |

Indizes: `id, name, categoryId, locationId, quantity, updatedAt`.

## Category

| Feld | Typ |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `icon` | `string` (Emoji) |
| `parentId` | `string \| null` (für zukünftige Unterkategorien) |
| `createdAt` / `updatedAt` | `number` |

Standardkategorien (`src/db/defaultCategories.ts`):

- **Food:** Backen, Konserven, Nudeln & Reis, Frühstück, Süßigkeiten, Getränke,
  Tiefkühl, Gewürze, Soßen, Sonstiges
- **Household:** Waschmittel, Reinigung, Papierwaren, Spülen, Müllbeutel,
  Körperpflege, Sonstiges

Nutzer können beliebige weitere Kategorien anlegen und löschen
(`Einstellungen → Kategorien`).

## Location

| Feld | Typ |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `parentId` | `string \| null` – ermöglicht Hierarchien (z. B. Keller → Regal 3 → Fach B) |
| `createdAt` / `updatedAt` | `number` |

Standardorte: Küche, Keller, Speisekammer, Bad, Garage, Sonstiges. v1.0 zeigt in der
Artikel-Zuordnung nur eine flache Liste; das Datenmodell unterstützt beliebige Tiefe
schon jetzt über `parentId`.

## InventoryTransaction

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | `string` | |
| `itemId` | `string` | Fremdschlüssel auf `Item` |
| `delta` | `number` | `newQuantity - previousQuantity` (kann 0 sein, wenn am Nullpunkt geklemmt wurde) |
| `previousQuantity` | `number` | |
| `newQuantity` | `number` | |
| `reason` | `'purchase' \| 'consumption' \| 'adjustment'` | `purchase` = „+“-Tap, `consumption` = „−“-Tap, `adjustment` = direkte Mengeneingabe |
| `timestamp` | `number` | ms epoch |

Jede Mengenänderung erzeugt genau eine Transaktion, geschrieben in derselben
Dexie-Transaktion wie die Bestandsänderung (`inventoryService.adjustQuantity` /
`setQuantity`). `undoTransaction(id)` stellt `previousQuantity` wieder her und löscht
den Eintrag.

## Tag / ItemTag

| Tag | Typ | | ItemTag | Typ |
|---|---|---|---|---|
| `id` | `string` | | `id` | `string` |
| `name` | `string` | | `itemId` | `string` |
| | | | `tagId` | `string` |

Many-to-many-Beziehung zwischen `Item` und `Tag` über die Zwischentabelle `ItemTag`
(Index `[itemId+tagId]`). Tags werden im Artikelformular als kommagetrennte Liste
gepflegt und bei Bedarf automatisch angelegt.

## Abgeleitete Werte (nicht persistiert)

- **Lagerstatus** (`getStockStatus`, `src/types/models.ts`):
  - `out`, wenn `quantity <= 0`
  - `low`, wenn `quantity <= minimumQuantity` (aber `> 0`)
  - sonst `ok`
- **EnrichedItem** (`src/types/views.ts`): `Item` angereichert mit aufgelöster
  `category`, `location`, `tags[]` und `stockStatus` – wird ausschließlich für die
  Anzeige gebildet (`inventoryQueryService.getEnrichedItems`), nie persistiert.

## Backup-Dateiformat

`Vorrat-Backup-YYYY-MM-DD.zip` enthält eine `data.json` mit:

```json
{
  "schemaVersion": 1,
  "exportedAt": 1234567890,
  "data": {
    "items": [...],
    "categories": [...],
    "locations": [...],
    "transactions": [...],
    "tags": [...],
    "itemTags": [...]
  }
}
```

Der Import validiert Struktur und Feldtypen jedes Datensatzes
(`src/services/backupValidation.ts`), bevor irgendetwas geschrieben wird.
