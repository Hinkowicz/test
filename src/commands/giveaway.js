import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { createGiveaway, endGiveaway, getGiveaway, listActive, reroll } from '../giveaways.js';
import { parseDuration } from '../util.js';

export const data = new SlashCommandBuilder()
  .setName('giveaway')
  .setDescription('Gewinnspiele verwalten')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommand((s) =>
    s
      .setName('start')
      .setDescription('Neues Gewinnspiel starten')
      .addStringOption((o) => o.setName('preis').setDescription('Was wird verlost?').setRequired(true).setMaxLength(200))
      .addStringOption((o) => o.setName('dauer').setDescription('z. B. 30m, 2h, 1d12h').setRequired(true))
      .addIntegerOption((o) => o.setName('gewinner').setDescription('Anzahl Gewinner (Standard 1)').setMinValue(1).setMaxValue(20))
      .addChannelOption((o) =>
        o.setName('kanal').setDescription('Kanal (Standard: aktueller)').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName('end')
      .setDescription('Gewinnspiel sofort beenden')
      .addStringOption((o) => o.setName('nachricht_id').setDescription('ID der Gewinnspiel-Nachricht').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('reroll')
      .setDescription('Gewinner neu auslosen')
      .addStringOption((o) => o.setName('nachricht_id').setDescription('ID der Gewinnspiel-Nachricht').setRequired(true)),
  )
  .addSubcommand((s) => s.setName('list').setDescription('Aktive Gewinnspiele anzeigen'));

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'start') {
    const durationMs = parseDuration(interaction.options.getString('dauer'));
    if (!durationMs) {
      return interaction.reply({ content: 'Ungültige Dauer. Beispiele: `30m`, `2h`, `1d12h`.', ephemeral: true });
    }
    const channel = interaction.options.getChannel('kanal') ?? interaction.channel;
    const g = await createGiveaway(channel, {
      prize: interaction.options.getString('preis'),
      winnerCount: interaction.options.getInteger('gewinner') ?? 1,
      durationMs,
      hostId: interaction.user.id,
    });
    return interaction.reply({ content: `Gewinnspiel gestartet in <#${channel.id}> (ID \`${g.messageId}\`).`, ephemeral: true });
  }

  if (sub === 'list') {
    const active = listActive(interaction.guildId);
    const text = active.length
      ? active.map((g) => `• **${g.prize}** – endet <t:${Math.floor(g.endsAt / 1000)}:R> – ID \`${g.messageId}\``).join('\n')
      : 'Keine aktiven Gewinnspiele.';
    return interaction.reply({ content: text, ephemeral: true });
  }

  const id = interaction.options.getString('nachricht_id');
  const g = getGiveaway(id);
  if (!g || g.guildId !== interaction.guildId) {
    return interaction.reply({ content: 'Gewinnspiel nicht gefunden.', ephemeral: true });
  }
  await interaction.deferReply({ ephemeral: true });
  const result = sub === 'end' ? await endGiveaway(interaction.client, id) : await reroll(interaction.client, id);
  const hint = sub === 'end' ? 'ist bereits beendet' : 'ist noch nicht beendet';
  return interaction.editReply(result ? 'Erledigt.' : `Dieses Gewinnspiel ${hint}.`);
}
