import { Client, ChatInputCommandInteraction } from 'discord.js';
import { pickCategoryAndItem, createEmbed, respondToInteraction } from './utils';

export async function handleFood(client: Client, interaction: ChatInputCommandInteraction) {
  try {
    const cat = interaction.options.getString('類別') || undefined;
    const result = pickCategoryAndItem(cat || undefined);
    const item = result.item ?? '無可用選項';
    const category = result.category ?? '隨機類別';

    const embed = createEmbed(`今天吃什麼 — ${category}`, `# 花火建議你吃/喝 **${item}**`, 0x00cc66);
    await respondToInteraction(interaction, embed, false);
  } catch (err) {
    console.error('handleFood 錯誤', err);
    const embed = createEmbed('錯誤', '無法取得餐點建議。', 0xff0000);
    await respondToInteraction(interaction, embed, true);
  }
}

export default { handleFood };
