# Discord Giveaway Bot

## Einrichtung
1. Anwendung auf https://discord.com/developers/applications anlegen, unter **Bot** einen Token erzeugen.
2. Bot mit den Scopes `bot` und `applications.commands` auf den Server einladen
   (Rechte: Nachrichten senden, Links einbetten).
3. `.env.example` nach `.env` kopieren und `DISCORD_TOKEN`, `CLIENT_ID` (optional `GUILD_ID`) eintragen.
4. `npm install && npm run deploy && npm start` (Node.js ≥ 20).

## Commands
- `/giveaway start preis dauer [gewinner] [kanal]` – Gewinnspiel mit Teilnehmen-Button
- `/giveaway end|reroll nachricht_id`, `/giveaway list`
- `/link get name` (mit Autocomplete), `/link list`
- `/link add|remove` – Links verwalten (Mods)
