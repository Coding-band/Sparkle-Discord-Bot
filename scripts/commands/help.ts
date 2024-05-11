import { CacheType, CommandInteraction, Interaction, MessageInteraction, PermissionFlagsBits, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from 'discord.js';
import { CommandRegistType } from '../constants/types';

const HELP_COMMANDS: CommandRegistType = {
	name: "commands",
	localeName: "指令列表",
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('查詢指令使用方法/關於'),
	execute: async (interaction: CommandInteraction) => {
		await interaction.reply('Pong!');
	},
};

const HELP_ABOUT: CommandRegistType = {
	name: "about",
	localeName: "關於",
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('查詢指令使用方法/關於'),
	execute: async (interaction: CommandInteraction) => {
		await interaction.reply('Pong!');
	},
};

const LIST_SUBCOMMANDS: CommandRegistType[] = [
	HELP_COMMANDS,
	HELP_ABOUT,
]

const HELP: CommandRegistType = {
	data: new SlashCommandBuilder()
		.setName('查詢')
		.setDescription('查詢指令使用方法/關於')
		.addStringOption((option: SlashCommandStringOption) => (
			option.setName("選擇")
				.setDescription("請選擇需要查詢甚麼。")
				.setRequired(true)
				.addChoices(
					LIST_SUBCOMMANDS.map((cmd: CommandRegistType) => (
						{ name: cmd.localeName!, value: cmd.name! }))
				)
		)) as SlashCommandBuilder,
	execute: async (interaction: CommandInteraction) => {
		switch (interaction.options.data[0].value) {
			case HELP_COMMANDS.name: { HELP_COMMANDS.execute(interaction); break; }
			default: { await interaction.reply("該指令暫未實裝。"); break; }
		}

	},
};

export default HELP;