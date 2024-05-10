import { CacheType, CommandInteraction, Interaction, MessageInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandRegistType } from '../constants/types';

const PING : CommandRegistType = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	execute : async (interaction : CommandInteraction) => {
		await interaction.reply('Pong!');
	},
};

export default PING;