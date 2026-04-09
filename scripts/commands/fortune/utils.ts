import { EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';

// Constants
export const COLORS = {
  SUCCESS: 0x00ff00,
  ERROR: 0xff0000,
  INFO: 0x0099ff,
  WARNING: 0xffa500,
  FORTUNE: 0xffd700
} as const;

export const MESSAGES = {
  ERRORS: {
    FORTUNE_FAILED: '獲取運氣時發生錯誤。'
  },
  SUCCESS: {
    FORTUNE_SUCCESS: '今日運氣'
  },
  FORTUNES: [
    '大吉：今天運氣極佳，一切順利！',
    '中吉：今天運氣不錯，注意小細節。',
    '小吉：今天運氣一般，保持樂觀。',
    '吉：今天運氣尚可，機會來了要把握。',
    '末吉：今天運氣平平，耐心等待。',
    '凶：今天運氣不佳，小心行事。',
    '大凶：今天運氣很差，避免冒險。'
  ]
} as const;

/**
 * Get a random fortune message based on today's date
 */
export function getRandomFortune(clientId: string): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const dateNum = parseInt(dateStr) + parseInt(clientId.slice(-4) || '0');

  const index = dateNum % MESSAGES.FORTUNES.length;
  return MESSAGES.FORTUNES[index];
}

export function createEmbed(title: string, description: string, color: number) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

export async function respondToInteraction(
  interaction: ChatInputCommandInteraction,
  embed: EmbedBuilder,
  components: any[] = [],
  ephemeral = false
) {
  const options: any = { embeds: [embed] };
  if (components.length > 0) options.components = components;

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(options);
  } else {
    await interaction.reply({ ...options, ephemeral });
  }
}

export async function respondWithError(interaction: ChatInputCommandInteraction, message: string) {
  const embed = createEmbed('錯誤', message, COLORS.ERROR);
  await respondToInteraction(interaction, embed, [], true);
}
