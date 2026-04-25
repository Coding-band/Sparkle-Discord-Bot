import { SlashCommandBuilder, ChatInputCommandInteraction, Client, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('管理員專用指令 / Admin commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // 預留：僅管理員可用
    .addSubcommand(subcommand =>
      subcommand
        .setName('添加警告按鈕')
        .setDescription('在指定頻道發送警告Embed與按鈕')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('要發送的頻道 (不填則為當前頻道)')
            .setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const mod = await import('./index');

    // 檢查是否管理員（在AdminList中）
    const adminList: string[] = process.env.AdminList ? JSON.parse(process.env.AdminList) : [];
    if (!adminList.includes(interaction.user.id)) {
      await interaction.reply({ content: 'You do not have permission to use this command! 你沒有權限使用這個指令！', ephemeral: true });
      return;
    }
    
    // 預留位置：未來有其他 subcommand 時可透過 switch-case 或 if-else 分發
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === '添加警告按鈕') {
        const { handleAddSpamButton } = (mod && (mod.default ?? mod)) || mod;
        await handleAddSpamButton(interaction.client as Client, interaction);
    }
  }
};
