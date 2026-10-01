# Discord Giveaway Bot

Discord-Bot für Gewinnspiele und Link-Commands. Node.js (ESM) + discord.js v14.

## Befehle
- `npm install` – Abhängigkeiten
- `npm test` – Unit-Tests (`node --test`, Logik in `src/util.js`)
- `npm run deploy` – Slash-Commands bei Discord registrieren (braucht `.env`)
- `npm start` – Bot starten (braucht `.env`)

## Struktur
- `src/index.js` – Client, Interaction-Routing (Commands, Autocomplete, Teilnehmen-Button)
- `src/commands/` – ein Modul pro Slash-Command (`data`, `execute`, optional `autocomplete`); in `index.js` registrieren
- `src/giveaways.js` – Gewinnspiel-Logik, Timer, Persistenz (`data/giveaways.json`)
- `src/storage.js` – JSON-Dateispeicher (atomares Schreiben)
- `data/links.default.json` – Standard-Links; Laufzeitdaten in `data/*.json` sind gitignored

## Konventionen
- Nutzertexte auf Deutsch, Code und Kommentare auf Englisch.
- Reine Logik in `src/util.js` halten und per Test abdecken.
- Secrets nur in `.env`, nie committen.
- Moderations-Commands benötigen die Berechtigung „Server verwalten“.
