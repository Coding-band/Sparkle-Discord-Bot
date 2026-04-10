import fs from 'fs';
import path from 'path';
import { EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';

const dataPath = path.join(process.cwd(), 'assets', 'json_data', 'food_list.json');


export function createEmbed(title: string, description: string, color = 0x00ff99) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

export async function respondToInteraction(interaction: ChatInputCommandInteraction, embed: EmbedBuilder, ephemeral = false) {
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.reply({ embeds: [embed], ephemeral });
  }
}
