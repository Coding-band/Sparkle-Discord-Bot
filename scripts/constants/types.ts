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

//以下所有項目均可為undefined
export type EventProgress = {
  dailyEventFinishedCount ?: number; //完成該每日任務的用戶數目
  limitEventMax ?: number; //該限時/挑戰任務的目標進度
  limitEventProgress ?: number; //該限時/挑戰任務的當前進度
  choiceEventData ?: []; //該分歧事件每一選項的選擇次數
}

export type EventInfo = {
  name: string; //活動名字
  desc: string; //活動簡介
  type: EventTypeEnum; //活動類型
  embed: EmbedBuilder; //活動Embed
  progress: EventProgress; //活動進度
  endTime: number; //活動完結時間
  execute: (() => Promise<void>)
}