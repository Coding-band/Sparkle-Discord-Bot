import { Client, Message } from "discord.js";
import { GreetingConst } from "./constants/constants";
import { checkAndUpdateGreetingMs, modifyUserCoin } from "./database";

export async function greetingsReward(client: Client, message: Message, generalChannels: string[]) {
  // 忽略機器人自身的訊息
  if (message.author.bot) return;
  // 確認是否為指定的大廳頻道
  if (generalChannels.includes(message.channelId)) return;

  const coinEmoji = "🪙";

  // 如果用戶在頻道發送訊息，則給予獎勵
  if (GreetingConst.morning_words.some((word) => message.content.toLowerCase().includes(word))) {
    message.react(GreetingConst.morning_reaction[Math.floor(Math.random() * GreetingConst.morning_reaction.length)]).catch(console.error);
    if (await checkAndUpdateGreetingMs(message.author.id, message.guildId!)) {
      await modifyUserCoin(message.author.id, message.guildId!, 1); // 獎勵 1 金幣
      message.react(coinEmoji).catch(console.error);
    }
  } else if (GreetingConst.afternoon_words.some((word) => message.content.toLowerCase().includes(word))) {
    message.react(GreetingConst.afternoon_reaction[Math.floor(Math.random() * GreetingConst.afternoon_reaction.length)]).catch(console.error);
    if (await checkAndUpdateGreetingMs(message.author.id, message.guildId!)) {
      await modifyUserCoin(message.author.id, message.guildId!, 1); // 獎勵 1 金幣
      message.react(coinEmoji).catch(console.error);
    }
  } else if (GreetingConst.night_words.some((word) => message.content.toLowerCase().includes(word))) {
    message.react(GreetingConst.night_reaction[Math.floor(Math.random() * GreetingConst.night_reaction.length)]).catch(console.error);
    if (await checkAndUpdateGreetingMs(message.author.id, message.guildId!)) {
      await modifyUserCoin(message.author.id, message.guildId!, 1); // 獎勵 1 金幣
      message.react(coinEmoji).catch(console.error);
    }
  }
}