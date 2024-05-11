import { CacheType, CommandInteraction, EmbedBuilder, Interaction, MessageInteraction, PermissionFlagsBits, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from 'discord.js';
import { CommandRegistType } from '../constants/types';
import { ColorConst, EnvConst } from '../constants/constants';

const usageEmbedBuilder = (commandStr : string, desc : string ) => {
	return new EmbedBuilder()
	.setColor(ColorConst.EMBED_ANNOUN_COLOR)
	.setTitle("`" + commandStr + "`")
	.setDescription(desc);
}

const HELP_COMMANDS: CommandRegistType = {
	name: "commands",
	localeName: "指令列表",
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('查詢指令使用方法'),
	usage: usageEmbedBuilder("指令列表", 
		"指令簡介 : 介紹所有可使用指令"+"\n"
	),
	execute: async (interaction: CommandInteraction) => {
		await interaction.reply({ embeds: [HELP_COMMANDS.usage!] });
	},
};

const HELP_ABOUT: CommandRegistType = {
	name: "about",
	localeName: "關於",
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('關於Bot'),
	usage: usageEmbedBuilder("/"+"查詢"+" 關於", 
		"指令簡介 : 關於"+EnvConst.BotName+"\n"
	),
	execute: async (interaction: CommandInteraction) => {
		const embed = new EmbedBuilder()
		.setColor(ColorConst.EMBED_ANNOUN_COLOR)
		.setTitle("關於"+EnvConst.BotName)
		.setDescription(
			"***你好你好，我是花火！你要是有什麼危險的差事要辦，儘管來找我。畢竟只要我感興趣，價錢都好商量。關鍵是要玩得開心，對吧？***"+"\n"
			+"<稍後再寫>"
		);
		await interaction.reply({embeds : [embed]});
	},
};

const LIST_SUBCOMMANDS: CommandRegistType[] = [
	HELP_COMMANDS,
	HELP_ABOUT,
]

const HELP: CommandRegistType = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setNameLocalizations({"zh-TW" : "查詢"})
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
			case HELP_ABOUT.name: { HELP_ABOUT.execute(interaction); break; }
			default: { await interaction.reply("該指令暫未實裝。"); break; }
		}

	},
};

export default HELP;