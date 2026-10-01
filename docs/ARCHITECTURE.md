# Architektur – Vorrat

## Schichten

```
UI (React-Komponenten)
  → Features (Seiten je Bereich: Dashboard, Inventar, Einstellungen)
    → Services (Geschäftslogik: Mengenänderung, Suche, Backup)
      → Repositories (reiner CRUD-Zugriff auf eine Dexie-Tabelle)
        → Database (Dexie.js über IndexedDB)
```

**Regel:** React-Komponenten importieren niemals `src/db/database.ts` direkt. Jeder
Datenzugriff läuft über ein Repository oder – wenn Geschäftslogik/Transaktionalität
nötig ist – über einen Service, der seinerseits Repositories bzw. `db.transaction(...)`
verwendet.

## Verzeichnisstruktur

```
src/
  db/
    database.ts          Dexie-Schema (Tabellen, Indizes, Versionierung)
    defaultCategories.ts Statische Seed-Listen (Kategorien, Orte)
    seed.ts               Legt Standardkategorien/-orte an, wenn die DB leer ist
    demoData.ts           Optionale, vom Nutzer ausgelöste Demo-Artikel
  types/
    models.ts             Domänenmodelle (Item, Category, Location, ...)
    views.ts               Angereicherte Lesemodelle für die UI (EnrichedItem)
  repositories/
    itemRepository.ts, categoryRepository.ts, locationRepository.ts,
    transactionRepository.ts, tagRepository.ts
    – je Tabelle: getAll/getById/create/update/delete/bulkPut/count.
    Keine Geschäftsregeln, keine Nebenwirkungen über die eigene(n) Tabelle(n) hinaus
    (Ausnahme: kaskadierendes Löschen abhängiger Datensätze).
  services/
    inventoryService.ts    Mengenänderung, Undo, Favoriten, Artikel-CRUD
    inventoryQueryService.ts  Reicht Items mit Kategorie/Ort/Tags/Lagerstatus an
    searchService.ts       Suche, Filter, Sortierung (reine Funktionen)
    backupService.ts / backupTypes.ts / backupValidation.ts
                            Export/Import als ZIP, Schema-Validierung, Konfliktanalyse
  hooks/
    Live-reaktive React-Hooks (`useLiveQuery`), die ausschließlich Services/
    Repositories aufrufen – nie `db` direkt.
  features/
    dashboard/, inventory/, settings/, undo/  – Seiten- und Feature-Komponenten
  components/
    Wiederverwendbare, zustandsarme UI-Bausteine (ItemCard, QuantityControl, Nav, ...)
  app/
    App.tsx (Routing), AppShell.tsx (Layout mit Navigation)
```

## Warum Dexie + Repository-Schicht?

- Dexie kapselt IndexedDB mit einer Promise-API und reaktiven Live-Queries
  (`dexie-react-hooks`), ohne einen Server vorauszusetzen.
- Die Repository-Schicht hält Dexie-spezifische Details (Tabellennamen, Indizes) aus
  Services und UI heraus. Ein Wechsel der Speicher-Engine (z. B. für eine spätere
  native App) würde nur die Repository-Implementierungen betreffen.
- Services kapseln Transaktionalität: Eine Mengenänderung und die zugehörige
  `InventoryTransaction` werden in einer einzigen Dexie-Transaktion geschrieben
  (`inventoryService.adjustQuantity`), sodass Bestand und Verlauf nie auseinanderlaufen.

## Reaktivität

UI-Komponenten lesen Daten über Hooks wie `useEnrichedItems()`, die intern
`useLiveQuery(() => inventoryQueryService.getEnrichedItems())` aufrufen. Dexies
Live-Query-Mechanismus erkennt automatisch, welche Tabellen während der Ausführung
gelesen wurden, und re-triggert die Query, sobald sich eine dieser Tabellen ändert –
ganz ohne manuelles State-Management oder einen globalen Store.

## Fehlerbehandlung

- Eine React `ErrorBoundary` (`src/components/ErrorBoundary.tsx`) fängt Rendering-Fehler
  ab, zeigt eine verständliche Meldung und betont, dass lokale Daten erhalten bleiben.
- Services werfen bei Inkonsistenzen (z. B. „Item nicht gefunden“) reguläre `Error`s;
  UI-Komponenten fangen diese und zeigen sie über `useUndoToast().showError(...)` als
  Toast an, niemals als rohen Stacktrace.

## PWA / Offline-Konzept

- `vite-plugin-pwa` generiert Manifest, Service Worker und Precaching der
  Build-Artefakte (`generateSW`-Modus, `registerType: 'prompt'`, `injectRegister: false`).

### Updates & Versionierung (ab v1.1.0)

- Der Service Worker wird genau einmal in `src/features/pwa-update/usePwaUpdate.ts`
  registriert (einzige Stelle, die `virtual:pwa-register/react` importiert).
- iOS setzt eine Home-Bildschirm-App meist nur fort, statt sie neu zu laden – dadurch
  würde der Browser nie nach Updates suchen. `updateChecks.ts` prüft deshalb bei jeder
  Rückkehr in den Vordergrund (`visibilitychange`) und stündlich, solange die App offen ist.
- Liegt eine neue Version bereit, zeigt `PwaUpdateBanner` „Neue Version verfügbar“ mit
  „Aktualisieren“/„Später“. „Aktualisieren“ aktiviert den wartenden Service Worker und
  lädt neu; IndexedDB-Daten bleiben unberührt. Die App muss **nicht** erneut zum
  Home-Bildschirm hinzugefügt werden.
- Versionsanzeige in den Einstellungen: `Version <package.json> · Build <Commit-SHA>`
  (über Vite-`define`, Quelle `src/constants/appVersion.ts`). Für ein Release
  `version` in `package.json` erhöhen; der Build-SHA kommt automatisch aus GitHub Actions.
- Manueller Check: Einstellungen → „Nach Updates suchen“.
- Da alle Daten in IndexedDB liegen (nicht im Netzwerk-Cache), funktionieren Lesen und
  Schreiben von Artikeln, Mengenänderungen und Transaktionen vollständig offline,
  sobald die App einmal geladen wurde.
- Der Service Worker ist im Dev-Server standardmäßig deaktiviert (`devOptions` nicht
  gesetzt); Offline-Tests laufen gegen einen Produktions-Build (`npm run build && npm
  run preview`).

## Erweiterbarkeit (siehe auch ROADMAP.md)

Die Schichtentrennung erlaubt es, künftige Funktionen anzudocken, ohne bestehende
Schichten umzubauen:

- **Barcode/OCR/KI-Produkterkennung**: neuer Service, der am Ende `inventoryService`
  aufruft, um Artikel/Mengen zu setzen.
- **iCloud-Synchronisation / natives SwiftUI**: Repositories bleiben die einzige
  Stelle, die Dexie kennt – ein SwiftUI-Client würde dieselben Domänenmodelle
  (`types/models.ts`) und dieselbe Transaktionslogik in Swift nachbilden und über
  einen Sync-Layer mit dem IndexedDB-Client abgleichen.
- **Einkaufslisten / Ablaufdaten / Preistracking**: zusätzliche Felder/Tabellen im
  Dexie-Schema (neue `version()`-Migration), neue Repository + Service, neue Feature-
  Seite – bestehende Schichten bleiben unverändert.
