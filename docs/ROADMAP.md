# Roadmap – Vorrat

## v1.0 (aktueller Umfang)

- [x] Dashboard mit Favoriten und Artikeln mit niedrigem/leerem Bestand
- [x] Inventarliste mit `[ − ] Menge [ + ]`, direkter Mengeneingabe, Undo
- [x] Artikel-CRUD (Name als einziges Pflichtfeld)
- [x] Kategorien (Standard + benutzerdefiniert)
- [x] Lagerorte (Standard + benutzerdefiniert, Datenmodell hierarchisch)
- [x] Mindestbestand mit „Fast leer“ / „Nicht vorhanden“
- [x] Favoriten
- [x] Suche (Name, Kategorie, Ort, Tags)
- [x] Filter (Lagerstatus, Favoriten, Kategorie, Lagerort)
- [x] Sortierung (Name, Menge, Lagerstatus, zuletzt geändert, Favoriten zuerst, je
      auf-/absteigend)
- [x] Transaktionsverlauf pro Artikel
- [x] IndexedDB-Persistenz über Dexie
- [x] Backup-Export/-Import als ZIP mit Schema-Validierung und Konfliktbehandlung
- [x] Responsive UI (Mobile-first ab 375px, Desktop-Sidebar ab 900px)
- [x] Dark Mode
- [x] PWA: Manifest, Icons, Service Worker, Offline-Betrieb nach erstem Laden
- [x] Demo-/Seed-Datensatz für realistische UI-Tests

## v1.1.0

- [x] Automatische Update-Erkennung (auch beim Fortsetzen der iOS-Home-Bildschirm-App)
- [x] Hinweis „Neue Version verfügbar“ mit „Aktualisieren“/„Später“ – kein erneutes
      Hinzufügen zum Home-Bildschirm nötig
- [x] Versions- und Build-Anzeige in den Einstellungen, manueller Update-Check

## Bewusst nicht in v1.0

Benutzerkonten, Cloud-Synchronisation, Multi-User, Barcode-Scanning, OCR/Rechnungs-
erkennung, KI-Funktionen, Supermarkt-APIs, Preisvergleich, Rezeptverwaltung,
automatische Einkaufslisten-Synchronisation, Zahlungen, native SwiftUI-App.

## Zukünftige Erweiterungspunkte

Die Architektur (siehe `ARCHITECTURE.md`) ist so geschnitten, dass folgende Themen
angedockt werden können, ohne bestehende Schichten neu zu schreiben:

| Erweiterung | Ansatzpunkt |
|---|---|
| Barcode-Scanning | Neue Feature-Komponente, die einen Scan-Service aufruft und am Ende `inventoryService.createItem`/`adjustQuantity` nutzt |
| Rechnungs-/Beleg-OCR | Neuer Service, der erkannte Positionen auf bestehende Artikel mappt |
| Automatische Produkterkennung | Zusätzliches Feld `barcode` am `Item`, neues Lookup-Repository |
| Einkaufslisten | Neue Tabelle `ShoppingListItem`, neues Repository/Service, neue Feature-Seite |
| Automatische Einkaufsvorschläge | Service, der `minimumQuantity`/Verlauf auswertet und Vorschläge in eine Einkaufsliste schreibt |
| Ablaufdaten | Zusätzliches Feld `expiresAt` am `Item`, Sortier-/Filteroption analog zu Lagerstatus |
| Produktfotos | Zusätzliches Feld `photoUrl`/Blob-Storage, keine Änderung an bestehenden Schichten nötig |
| Preistracking | Neue Tabelle `PriceObservation`, verknüpft über `itemId` |
| iCloud-Synchronisation | Sync-Layer unterhalb der Repository-Schicht; Domänenmodelle bleiben unverändert |
| Native SwiftUI-App | Swift-Client implementiert dieselben Domänenmodelle/Regeln (siehe `DATA_MODEL.md`) gegen einen gemeinsamen Sync-Layer |
| Widgets / Siri-Shortcuts | Nutzen denselben Sync-Layer wie eine native App; keine Änderung an der Web-Architektur |
| Multi-User-Synchronisation | Erfordert Konfliktauflösung auf Transaktionsebene – `InventoryTransaction` ist bereits das Ereignis-Log, auf dem ein CRDT/Merge-Mechanismus aufsetzen könnte |

Keiner dieser Punkte wird ohne ausdrückliche Anfrage umgesetzt.
