# Vorrat – Supermarkt-InventarAPP

Ein privates, offline-fähiges Haushaltsinventar als Progressive Web App (PWA). Erfasse Mengen von Lebensmitteln, Reinigungsmitteln und anderen Verbrauchsgütern schneller als in klassischen Inventar-Apps.

## Kerninteraktion

* **+** eine Einheit hinzufügen
* **−** eine Einheit entfernen
* Menge antippen, um sie direkt zu bearbeiten
* Rückgängig-Option nach jeder Mengenänderung

## Technologie

* TypeScript, React, Vite
* Dexie.js über IndexedDB als lokale Datenbank
* Service Worker + Web App Manifest (installierbar, offlinefähig)

## Architektur

```
UI → Features → Services → Repositories → Database
```

React-Komponenten greifen nie direkt auf IndexedDB zu – jeglicher Datenzugriff läuft über `src/repositories` und `src/services`.

```
src/
  db/            Dexie-Schema, Seed-Daten
  types/         Domänenmodelle & Views
  repositories/  reiner CRUD-Zugriff auf Dexie-Tabellen
  services/      Geschäftslogik (Mengenänderungen, Suche, Backup)
  hooks/         React-Hooks (live-reaktive Queries über services/repositories)
  features/      Seiten je Bereich (Dashboard, Inventar, Einstellungen)
  components/    wiederverwendbare UI-Bausteine
  app/           Routing & App-Shell
```

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungsserver
npm run typecheck  # TypeScript-Prüfung
npm test           # Vitest (Unit-Tests)
npm run build      # Produktionsbuild inkl. Service Worker
```

## Backup

Export/Import als `Vorrat-Backup-YYYY-MM-DD.zip` mit `data.json`. Der Import validiert Datei und Schema, zeigt eine Vorschau der enthaltenen Daten sowie erkannter Konflikte und lässt explizit wählen, ob vorhandene Einträge übersprungen oder überschrieben werden.

Details zu Umfang und Leitplanken des Projekts stehen in [`CLAUDE.md`](./CLAUDE.md).
