import { Client, Events, GatewayIntentBits } from 'discord.js';
import { commands } from './commands/index.js';
import { restoreTimers, toggleEntry } from './giveaways.js';

if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN fehlt (siehe .env.example).');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`Eingeloggt als ${c.user.tag}`);
  restoreTimers(c);
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
