import { Client, Events, GatewayIntentBits } from 'discord.js';
import { commands } from './commands/index.js';
import { restoreTimers, toggleEntry } from './giveaways.js';

if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN fehlt (siehe .env.example).');
  process.exit(1);
}

/** Keeps the slash commands at Discord in sync on every start (no manual `npm run deploy` needed). */
async function registerCommands(c) {
  const body = [...commands.values()].map((cmd) => cmd.data.toJSON());
  const { GUILD_ID } = process.env;
  if (GUILD_ID) await c.application.commands.set(body, GUILD_ID);
  else await c.application.commands.set(body);
  console.log(`${body.length} Commands registriert.`);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`Eingeloggt als ${c.user.tag}`);
  restoreTimers(c);
  registerCommands(c).catch((err) => console.error('Commands konnten nicht registriert werden:', err.message));
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await commands.get(interaction.commandName)?.execute(interaction);
    } else if (interaction.isAutocomplete()) {
      await commands.get(interaction.commandName)?.autocomplete?.(interaction);
    } else if (interaction.isButton() && interaction.customId === 'giveaway:enter') {
      const entered = await toggleEntry(interaction.client, interaction.message.id, interaction.user.id);
      const content =
        entered === null ? 'Dieses Gewinnspiel ist beendet.' : entered ? 'Du nimmst teil! 🎉' : 'Teilnahme zurückgezogen.';
      await interaction.reply({ content, ephemeral: true });
    }
  } catch (err) {
    console.error(err);
    if (interaction.isRepliable()) {
      const msg = { content: 'Da ist etwas schiefgelaufen.', ephemeral: true };
      await (interaction.deferred || interaction.replied ? interaction.followUp(msg) : interaction.reply(msg)).catch(() => {});
    }
  }
});

await client.login(process.env.DISCORD_TOKEN);
