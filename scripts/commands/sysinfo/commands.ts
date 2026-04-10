import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('系統資訊')
    .setDescription('顯示系統資訊'),

  async execute(interaction: ChatInputCommandInteraction) {
    const mod = await import('./index');
    const { handleSystemInfo: handleSystemInfo } = (mod && (mod.default ?? mod)) || mod;
    await handleSystemInfo(interaction.client as Client, interaction);
  }
};
