import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('今日運氣')
    .setDescription('今日的運氣是...'),

  async execute(interaction: ChatInputCommandInteraction) {
    // 為了相容舊有的 CommonJS 實作，動態 import 並取用 default 或 named export
    const mod = await import('./index');
    const { handleFortune } = (mod && (mod.default ?? mod)) || mod;
    await handleFortune(interaction.client as Client, interaction);
  }
};
