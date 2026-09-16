# Anforderungen – Vorrat

## Produktziel

Vorrat ist eine private, offline-first Haushalts-Inventar-App (PWA). Sie ersetzt den
Zettel an der Kühlschranktür: Ein Haushalt trägt ein, was gekauft oder verbraucht wurde,
und sieht auf einen Blick, was zur Neige geht.

Der zentrale Anwendungsfall:

> „Ich habe 3 Packungen Mehl gekauft.“ → Mehl **+3**
> „Ich habe eine Packung Mehl verbraucht.“ → Mehl **−1**

Eine normale Bestandsänderung muss mit **einem Tap** möglich sein. Geschwindigkeit hat
Vorrang vor Funktionsumfang.

## Nicht-Ziele (bewusst nicht in v1.0)

Benutzerkonten, Cloud-Datenbank/-Synchronisation, Multi-User, Barcode-Scanning, OCR,
KI-Funktionen, Supermarkt-APIs, Preisvergleich, Rezeptverwaltung, automatische
Einkaufslisten, Zahlungen, eine native SwiftUI-App. Die Architektur hält diese Optionen
offen (siehe `ROADMAP.md`), implementiert sie aber nicht.

## Qualitätsziele (in Prioritätsreihenfolge)

1. Geschwindigkeit der alltäglichen Bedienung
2. Einfachheit (keine unnötigen Dialoge, keine Pflichtfelder außer dem Namen)
3. Zuverlässigkeit (Bestand und Verlauf bleiben immer konsistent)
4. Offline-Funktionalität nach dem ersten Laden
5. Lokale Datenhoheit (keine Daten verlassen das Gerät ohne expliziten Export)
6. Hervorragende iPhone-Bedienung (große Touch-Ziele, Bottom-Navigation)
7. Wartbare, für spätere Erweiterungen offene Architektur

## User Stories

### Bestand ändern
- Als Nutzer sehe ich auf dem Inventar-Screen zu jedem Artikel `[ − ] Menge [ + ]` und
  kann mit einem Tap die Menge um 1 erhöhen oder verringern.
- Als Nutzer tippe ich auf die Menge, um sie direkt auf einen beliebigen Wert zu setzen.
- Als Nutzer sehe ich nach jeder Änderung kurz eine Bestätigung mit einer
  „Rückgängig“-Option.
- Als Nutzer kann die Menge nie unter 0 fallen, auch nicht durch mehrfaches,
  schnelles Antippen von „−“.

### Artikel verwalten
- Als Nutzer lege ich einen neuen Artikel mit nur einem Pflichtfeld (Name) an.
- Als Nutzer ordne ich einem Artikel Kategorie, Lagerort, Einheit, Mindestbestand,
  Notizen und Tags zu (optional).
- Als Nutzer lösche ich einen Artikel nach einer Bestätigung.
- Als Nutzer markiere ich Artikel als Favorit für schnellen Zugriff.

### Übersicht behalten
- Als Nutzer sehe ich auf dem Dashboard meine Favoriten und Artikel, die zur Neige
  gehen oder leer sind.
- Als Nutzer erkenne ich „Fast leer“ (`quantity <= minimumQuantity`) und
  „Nicht vorhanden“ (`quantity == 0`) auf einen Blick, ohne visuelles Rauschen.
- Als Nutzer durchsuche ich mein Inventar nach Name, Kategorie, Lagerort oder Tag und
  erhalte sofort Ergebnisse.
- Als Nutzer filtere und sortiere ich die Liste (Lagerstatus, Favoriten, Kategorie,
  Lagerort, Name, Menge, zuletzt geändert).
- Als Nutzer sehe ich pro Artikel den Verlauf seiner Bestandsänderungen.

### Struktur
- Als Nutzer verwende ich die vorgegebenen Standardkategorien/-orte oder lege eigene an.
- Als Nutzer bilde ich hierarchische Lagerorte ab (z. B. Keller → Regal 3 → Fach B),
  auch wenn v1.0 in der Oberfläche nur flache Orte anbietet.

### Daten sichern
- Als Nutzer exportiere ich mein gesamtes Inventar als ZIP-Datei
  (`Vorrat-Backup-YYYY-MM-DD.zip`).
- Als Nutzer importiere ich eine Backup-Datei, sehe vorher eine Zusammenfassung inkl.
  erkannter Konflikte und entscheide explizit, ob vorhandene Einträge überschrieben
  oder behalten werden. Es werden nie stillschweigend Daten verworfen.

### Offline-Nutzung
- Als Nutzer installiere ich die App auf dem Homescreen und nutze sie ohne
  Internetverbindung, inklusive Bestandsänderungen.

## Nicht-funktionale Anforderungen

- Mobile-first, getestet ab 375px Breite; Desktop-Layout ab 900px mit Sidebar.
- Dark Mode (folgt Systemeinstellung, manuell überschreibbar).
- Keine Server-Abhängigkeit; alle Daten liegen in IndexedDB auf dem Gerät.
- Fehler werden nie stillschweigend verschluckt; der Nutzer sieht verständliche
  Meldungen, technische Details landen in der Konsole.
