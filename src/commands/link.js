import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { loadJson, saveJson } from '../storage.js';
import { isHttpUrl } from '../util.js';

const FILE = 'data/links.json';
const load = () => loadJson(FILE, loadJson('data/links.default.json', {}));

export const data = new SlashCommandBuilder()
  .setName('link')
  .setDescription('Links ausgeben')
  .setDMPermission(false)
  .addSubcommand((s) =>
    s
      .setName('get')
      .setDescription('Einen Link ausgeben')
      .addStringOption((o) => o.setName('name').setDescription('Name des Links').setRequired(true).setAutocomplete(true)),
  )
  .addSubcommand((s) => s.setName('list').setDescription('Alle Links anzeigen'))
  .addSubcommand((s) =>
    s
      .setName('add')
      .setDescription('Link hinzufügen oder ändern (Mods)')
      .addStringOption((o) => o.setName('name').setDescription('Kurzname').setRequired(true).setMaxLength(32))
      .addStringOption((o) => o.setName('url').setDescription('https://…').setRequired(true))
      .addStringOption((o) => o.setName('beschreibung').setDescription('Kurze Beschreibung').setMaxLength(100)),
  )
  .addSubcommand((s) =>
    s
      .setName('remove')
      .setDescription('Link entfernen (Mods)')
      .addStringOption((o) => o.setName('name').setDescription('Name des Links').setRequired(true).setAutocomplete(true)),
  );

export async function autocomplete(interaction) {
  const focused = interaction.options.getFocused().toLowerCase();
  const choices = Object.keys(load()).filter((n) => n.includes(focused)).slice(0, 25);
  await interaction.respond(choices.map((n) => ({ name: n, value: n })));
}

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const links = load();

  if (sub === 'get') {
    const entry = links[interaction.options.getString('name').toLowerCase()];
    if (!entry) return interaction.reply({ content: 'Diesen Link gibt es nicht. Siehe `/link list`.', ephemeral: true });
    return interaction.reply(`${entry.description ? `**${entry.description}**\n` : ''}${entry.url}`);
  }

  if (sub === 'list') {
    const lines = Object.entries(links).map(([n, e]) => `• \`${n}\` – ${e.description || e.url}`);
    return interaction.reply({ content: lines.join('\n') || 'Noch keine Links vorhanden.', ephemeral: true });
  }

  if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: 'Dafür fehlt dir die Berechtigung „Server verwalten“.', ephemeral: true });
  }

  const name = interaction.options.getString('name').toLowerCase();
  if (sub === 'add') {
    const url = interaction.options.getString('url');
    if (!isHttpUrl(url)) return interaction.reply({ content: 'Bitte eine gültige http(s)-URL angeben.', ephemeral: true });
    links[name] = { url, description: interaction.options.getString('beschreibung') ?? '' };
    saveJson(FILE, links);
    return interaction.reply({ content: `Link \`${name}\` gespeichert.`, ephemeral: true });
  }

  if (!links[name]) return interaction.reply({ content: 'Diesen Link gibt es nicht.', ephemeral: true });
  delete links[name];
  saveJson(FILE, links);
  return interaction.reply({ content: `Link \`${name}\` entfernt.`, ephemeral: true });
}
