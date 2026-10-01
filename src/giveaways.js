import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { loadJson, saveJson } from './storage.js';
import { pickWinners } from './util.js';

const FILE = 'data/giveaways.json';
const MAX_TIMEOUT = 2 ** 31 - 1;

/** messageId -> { messageId, channelId, guildId, prize, winnerCount, endsAt, hostId, entries[], ended, winners[] } */
const giveaways = new Map(Object.entries(loadJson(FILE, {})));
const timers = new Map();

const persist = () => saveJson(FILE, Object.fromEntries(giveaways));

export const getGiveaway = (id) => giveaways.get(id);
export const listActive = (guildId) =>
  [...giveaways.values()].filter((g) => g.guildId === guildId && !g.ended);

export function buildMessage(g) {
  const embed = new EmbedBuilder()
    .setTitle(`🎉 ${g.prize}`)
    .setColor(g.ended ? 0x95a5a6 : 0x5865f2)
    .addFields(
      { name: 'Gewinner', value: String(g.winnerCount), inline: true },
      { name: 'Teilnehmer', value: String(g.entries.length), inline: true },
      { name: 'Veranstalter', value: `<@${g.hostId}>`, inline: true },
    );
  if (g.ended) {
    embed.setDescription(
      g.winners.length
        ? `Gewonnen haben: ${g.winners.map((id) => `<@${id}>`).join(', ')}`
        : 'Keine Teilnehmer – kein Gewinner.',
    );
  } else {
    embed.setDescription(
      `Klicke auf den Button zum Teilnehmen.\nEndet <t:${Math.floor(g.endsAt / 1000)}:R>`,
    );
  }
  const button = new ButtonBuilder()
    .setCustomId('giveaway:enter')
    .setLabel('Teilnehmen')
    .setEmoji('🎉')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(g.ended);
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(button)] };
}

export async function createGiveaway(channel, { prize, winnerCount, durationMs, hostId }) {
  const g = {
    guildId: channel.guildId,
    channelId: channel.id,
    prize,
    winnerCount,
    hostId,
    endsAt: Date.now() + durationMs,
    entries: [],
    ended: false,
    winners: [],
  };
  const message = await channel.send(buildMessage(g));
  g.messageId = message.id;
  giveaways.set(g.messageId, g);
  persist();
  schedule(channel.client, g);
  return g;
}

/** Toggles entry. Returns true if the user is now entered. */
export async function toggleEntry(client, messageId, userId) {
  const g = giveaways.get(messageId);
  if (!g || g.ended) return null;
  const i = g.entries.indexOf(userId);
  if (i === -1) g.entries.push(userId);
  else g.entries.splice(i, 1);
  persist();
  await refreshMessage(client, g);
  return i === -1;
}

async function refreshMessage(client, g) {
  try {
    const channel = await client.channels.fetch(g.channelId);
    const message = await channel.messages.fetch(g.messageId);
    await message.edit(buildMessage(g));
  } catch (err) {
    console.warn(`Could not update giveaway ${g.messageId}:`, err.message);
  }
}

export async function endGiveaway(client, messageId) {
  const g = giveaways.get(messageId);
  if (!g || g.ended) return null;
  clearTimeout(timers.get(messageId));
  g.ended = true;
  g.winners = pickWinners(g.entries, g.winnerCount);
  persist();
  await refreshMessage(client, g);
  await announce(client, g);
  return g;
}

export async function reroll(client, messageId) {
  const g = giveaways.get(messageId);
  if (!g || !g.ended) return null;
  g.winners = pickWinners(g.entries, g.winnerCount);
  persist();
  await refreshMessage(client, g);
  await announce(client, g, true);
  return g;
}

async function announce(client, g, rerolled = false) {
  try {
    const channel = await client.channels.fetch(g.channelId);
    const text = g.winners.length
      ? `${rerolled ? '🔄 Neu gelost' : '🎉 Glückwunsch'} ${g.winners.map((id) => `<@${id}>`).join(', ')}! Du hast **${g.prize}** gewonnen!`
      : `Keine Teilnehmer bei **${g.prize}**.`;
    await channel.send({ content: text, reply: { messageReference: g.messageId, failIfNotExists: false } });
  } catch (err) {
    console.warn('Could not announce winners:', err.message);
  }
}

function schedule(client, g) {
  const delay = Math.max(0, g.endsAt - Date.now());
  // setTimeout caps at ~24.8 days; re-arm for longer giveaways.
  const timer = setTimeout(
    () => (delay > MAX_TIMEOUT ? schedule(client, g) : endGiveaway(client, g.messageId)),
    Math.min(delay, MAX_TIMEOUT),
  );
  timers.set(g.messageId, timer);
}

/** Re-arms timers after a restart; overdue giveaways end immediately. */
export function restoreTimers(client) {
  for (const g of giveaways.values()) if (!g.ended) schedule(client, g);
}
