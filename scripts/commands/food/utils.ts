import fs from 'fs';
import path from 'path';
import { EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';

const dataPath = path.join(process.cwd(), 'assets', 'json_data', 'food_list.json');

export type FoodData = Record<string, string[]>;

export function loadFoodData(): FoodData {
  try {
    const raw = fs.readFileSync(dataPath, { encoding: 'utf8' });
    return JSON.parse(raw) as FoodData;
  } catch (err) {
    console.error('無法讀取 food_list.json:', err);
    return {};
  }
}

export function getFoodCategories(): { name: string; value: string }[] {
  const data = loadFoodData();
  return Object.keys(data).map(k => ({ name: k, value: k }));
}

export function pickRandomFromArray<T>(arr: T[]): T | null {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickCategoryAndItem(category?: string) {
  const data = loadFoodData();
  const categories = Object.keys(data);

  let chosenCategory = category;

  if (!chosenCategory || !data[chosenCategory]) {
    chosenCategory = pickRandomFromArray(categories) as string;
  }

  const items = data[chosenCategory] || [];
  const chosenItem = pickRandomFromArray(items);

  return { category: chosenCategory, item: chosenItem };
}

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
