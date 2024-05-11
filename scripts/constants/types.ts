import { CommandInteraction, CommandInteractionOption, EmbedBuilder, SlashCommandBuilder, } from "discord.js"
import { ColorConst } from "./constants";

const defaultUsageEmbed = new EmbedBuilder()
  .setColor(ColorConst.EMBED_ANNOUN_COLOR)
  .setTitle("「焰錦遊魚」- 花火")
  .setDescription("你好你好，我是花火！你要是有什麼危險的差事要辦，儘管來找我。畢竟只要我感興趣，價錢都好商量。關鍵是要玩得開心，對吧？");

export type CommandRegistType = {
  name?: string | "unknown",
  localeName?: string | "未知",
  usage?: EmbedBuilder | typeof defaultUsageEmbed,
  fullCommand?: string | "</查詢:1238536659553747077>"
  data: SlashCommandBuilder,
  execute: ((interaction: CommandInteraction) => Promise<void>)
}

export type TextLanguage = {
  langCode: string;
  langLocaleName: string;
}

export enum EventTypeEnum{
  Daily, LimitTimeMission, Battle, Selection
}

export type EventInfo = {
  name: string;
  desc: string;
  type: EventTypeEnum;
  embed: EmbedBuilder;
  execute: (() => Promise<void>)
}