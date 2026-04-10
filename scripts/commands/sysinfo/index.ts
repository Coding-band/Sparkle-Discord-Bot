import { Client, ChatInputCommandInteraction, EmbedBuilder, version } from 'discord.js';
import os from 'os';
import { respondToInteraction } from './utils';

function formatTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timezoneOffset = date.getTimezoneOffset();
  const utcOffset = timezoneOffset / -60;
  return `${year}/${month}/${day} - ${hours}:${minutes} [UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}]`;
}

export async function handleSystemInfo(client: Client, interaction: ChatInputCommandInteraction) {
  try {
    // 計算自訊息創建以來的延遲（PING值）
    const ping = Date.now() - interaction.createdTimestamp;
    // 計算RAM用量
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsage = `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB / ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`;

    // 計算CPU使用量（近似平均）
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;
    cpus.forEach(cpu => {
      Object.keys(cpu.times).forEach(type => {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      });
      totalIdle += cpu.times.idle;
    });
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const cpuUsage = 100 - ~~(100 * idle / total);

    // 創建嵌入訊息，使用 Fields 來呈現資訊
    const embed = new EmbedBuilder()
      .setTitle('系統資訊')
      .setColor(0x00ff99)
      .addFields(
        { name: 'CPU使用量', value: `${cpuUsage}%`, inline: true },
        { name: 'Discord.js 版本', value: version, inline: true },
        { name: 'PING值', value: `${client.ws.ping} ms ｜ ${ping} ms`, inline: true },
        { name: 'RAM用量', value: ramUsage, inline: true },
        { name: '啟動時間', value: client.readyAt ? formatTime(new Date(client.readyAt)) : '未知', inline: true },
        { name: '當前時間', value: formatTime(new Date()), inline: true }
      )
      .setTimestamp();

    // 回覆互動，這裡只需要傳入 embed 物件即可
    await respondToInteraction(interaction, embed);
  } catch (error) {
    console.error('處理系統資訊時發生錯誤:', error);
    const errorEmbed = new EmbedBuilder()
      .setTitle('錯誤')
      .setDescription('抱歉，無法取得系統資訊。')
      .setColor(0xff0000);
    await respondToInteraction(interaction, errorEmbed);
  }
}

export default { handleSystemInfo };
