import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import { getFoodCategories } from './utils';

export default {
  data: new SlashCommandBuilder()
    .setName('今天吃甚麼')
    .setDescription('隨機建議今天吃什麼')
    .addStringOption(opt =>
      opt.setName('類別')
        .setDescription('食物類別（可選）')
        .addChoices(...getFoodCategories())
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const mod = await import('./index');
    const { handleFood } = (mod && (mod.default ?? mod)) || mod;
    await handleFood(interaction.client as Client, interaction);
  }
};
