import { EmbedBuilder, Client, ChatInputCommandInteraction } from 'discord.js';
import { COLORS, MESSAGES, getRandomFortune, createEmbed, respondToInteraction, respondWithError } from './utils';

export async function handleFortune(client: Client, interaction: ChatInputCommandInteraction) {
  try {
    const fortune = getRandomFortune(client.user?.id ?? '0');
    const embed = createEmbed(MESSAGES.SUCCESS.FORTUNE_SUCCESS, fortune, COLORS.FORTUNE);

    await respondToInteraction(interaction, embed, [], false);
  } catch (error) {
    console.error('Error handling fortune:', error);
    await respondWithError(interaction, MESSAGES.ERRORS.FORTUNE_FAILED);
  }
}

export default { handleFortune };
