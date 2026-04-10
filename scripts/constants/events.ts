/**
 * All Events will be place at there.
 */

import { APIEmbedField, ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, MessageActionRowComponentBuilder, TextChannel, ComponentType, Message, ButtonInteraction } from "discord.js"
import { EventInfo, EventProgress, EventTypeEnum } from "./types";
import { mission_list as DailyMissionList } from "../../assets/json_data/daily_mission_list.json"
import { limited_time_mission_list as LimitedTimeMissionList } from "../../assets/json_data/limited_time_mission_list.json"
import { ColorConst } from "./constants";
import { logDailyMission, hasUserDoneMission, getTodayMissionCount, saveMissionMessage, getRecentMissionMessages } from "../database";

//Global Event List
export let EventList: Array<EventInfo> = [];

export async function sendDailyMissions(client: Client) {
  const channelGaming = client.channels.cache.get(process.env.GamingChannel!) as TextChannel;

  const randomChoiceIndex = Math.min(Math.round(Math.random() * DailyMissionList.length), DailyMissionList.length - 1);
  const missionId = `dailymission_${randomChoiceIndex}_${Date.now()}`;
  const expireTime = new Date().setHours(23, 59, 59, 999); // 設定為今天午夜過後
  const embed = await generateDailyMissions(client, 27, channelGaming, missionId, expireTime);
  const sentMessage = await sendEmbedMessage(embed); 
  await eventEmbedInteractiveHandler(embed.options, sentMessage, embed.files[0]);

}

export async function sendLimitTimeMissions(client: Client, autoLoop: boolean = true) {
  const channelGaming = client.channels.cache.get(process.env.GamingChannel!) as TextChannel;

  const randomChoiceIndex = Math.min(Math.round(Math.random() * LimitedTimeMissionList.length), LimitedTimeMissionList.length - 1);
  const missionId = `limittimemission_${randomChoiceIndex}_${Date.now()}`;
  const expireTime = Date.now() + 8*60*60*1000; // 設定為8小時後過期
  const embed = await generateLimitTimeMissions(client, randomChoiceIndex, channelGaming, missionId, expireTime);
  const sentMessage = await sendEmbedMessage(embed); 
  await eventEmbedInteractiveHandler(embed.options, sentMessage, embed.files[0]);

  if(autoLoop) {
    // 隨機時間（1~3小時）後再次觸發限時任務
    const randomDelay = (8 + Math.random()*4) * 60 * 60 * 1000; // 8小時基礎 + 0~4小時的隨機延遲
    setTimeout(async() => {
      await sendLimitTimeMissions(client);
    }, randomDelay);
    
  }
}

// 生成每日任務Embed
export async function generateDailyMissions(client: Client, randomChoiceIndex: number, channel: TextChannel, missionId: string, expireTime: number) {

  const randomChoiceMission = DailyMissionList[randomChoiceIndex];
  const imagePath = randomChoiceMission.img ? './assets/images/' + randomChoiceMission.img : undefined;
  
  // 建立互動式任務訊息
  const embedItem = await createInteractiveEventMessage({
    missionId: missionId, // 用於資料庫紀錄與 Collector 恢復的識別
    expireTime: expireTime, // 用於任務過期檢查
    channel: channel,
    title: `每日任務`,
    imagePath: imagePath,
    fields: [{ title: randomChoiceMission.mission_title, desc: randomChoiceMission.mission_desc, isSingleLine: false }],
    eventType: EventTypeEnum.Daily,
    initialProgress: { finishedCount: await getTodayMissionCount(missionId) },
    embedColor: ColorConst.EMBED_GAMING_DAILY_MISSION_COLOR,
    choices: randomChoiceMission.choices,
    choicesAction: randomChoiceMission.choices_action,
    onInteraction: async (interaction, action, updateEmbed) => {
      switch (action) {
        case "MISSION_FINISH": {
          // 檢查任務是否已過期
          if (Date.now() > expireTime) {
            await interaction.reply({ content: '很抱歉，任務已經過期了！', ephemeral: true });
            break;
          }
          // 檢查使用者是否已經完成過該訊息的任務了，避免重複完成
          const hasDone = await hasUserDoneMission(interaction.user.id, missionId);
          if (hasDone) {
            await interaction.reply({ content: '您已經完成任務了！', ephemeral: true });
            break;
          }

          // 紀錄進資料庫（以 message_id + channel_id）
          await logDailyMission(interaction.user.id, action, missionId);
          const currentPeopleCount = await getTodayMissionCount(missionId);

          // 更新 Embed（透過提供的回呼函式）
          await updateEmbed({ finishedCount: currentPeopleCount });

          // 回覆使用者
          await interaction.reply({ content: randomChoiceMission.choices_reply.replace('{count}', currentPeopleCount.toString()), ephemeral: true });
          break;
        }
      }
    }
  } as EmbedOptions);

  return embedItem;
}

// 生成限時任務Embed
export async function generateLimitTimeMissions(client: Client, randomChoiceIndex: number, channel: TextChannel, missionId: string, expireTime: number) {

  const randomChoiceMission = LimitedTimeMissionList[randomChoiceIndex];
  const imagePath = randomChoiceMission.img ? './assets/images/' + randomChoiceMission.img : undefined;

  // 建立互動式任務訊息
  const embedItem = await createInteractiveEventMessage({
    missionId: missionId, // 用於資料庫紀錄與 Collector 恢復的識別
    expireTime: expireTime, // 用於任務過期檢查
    channel: channel,
    title: `限時任務`,
    imagePath: imagePath,
    fields: [{ title: randomChoiceMission.mission_title, desc: randomChoiceMission.mission_desc, isSingleLine: false },{title: "完結時間", desc: `<t:${Math.floor(expireTime / 1000)}:f>`, isSingleLine: false}],
    eventType: EventTypeEnum.LimitTimeMission,
    initialProgress: { limitEventProgress: await getTodayMissionCount(missionId), limitEventMax: randomChoiceMission?.mission_max_progress ?? 16 },
    embedColor: ColorConst.EMBED_GAMING_LIMIT_MISSION_COLOR,
    choices: randomChoiceMission.choices,
    choicesAction: randomChoiceMission.choices_action,
    onInteraction: async (interaction, action, updateEmbed) => {
      switch (action) {
        case "MISSION_FINISH": {
          // 檢查任務是否已過期
          if (Date.now() > expireTime) {
            await interaction.reply({ content: '很抱歉，任務已經過期了！', ephemeral: true });
            break;
          }
          // 檢查使用者是否已經完成過該訊息的任務了，避免重複完成
          const hasDone = await hasUserDoneMission(interaction.user.id, missionId);
          if (hasDone) {
            await interaction.reply({ content: '您已經完成任務了！', ephemeral: true });
            break;
          }

          // 紀錄進資料庫（以 message_id + channel_id）
          await logDailyMission(interaction.user.id, action, missionId);
          const currentPeopleCount = await getTodayMissionCount(missionId);

          // 更新 Embed（透過提供的回呼函式）
          await updateEmbed({ limitEventProgress: currentPeopleCount });

          // 回覆使用者
          await interaction.reply({ content: randomChoiceMission.choices_reply.replace('{count}', currentPeopleCount.toString()), ephemeral: true });
          break;
        }
      }
    }
  } as EmbedOptions);

  return embedItem;
}

const fileName = (image: string) => {
  const splitted = image!.split("/");
  return splitted[splitted.length - 1]
};

export type EmbedField = {
  title: string;
  desc: string;
  isSingleLine: boolean;
}

export type EmbedOptions = {
  missionId?: string; // 用於資料庫紀錄與 Collector 恢復的識別, baseMissionId_index
  expireTime: number; // 用於任務過期檢查
  channel: TextChannel;
  title: string;
  desc?: string | null;
  imagePath?: string;
  fields?: Array<EmbedField>;
  eventType: EventTypeEnum;
  initialProgress: EventProgress;
  embedColor?: number;
  choices: string[];
  choicesAction?: string[];
  onInteraction: (
    interaction: ButtonInteraction,
    action: string,
    updateEmbed: (newProgress: EventProgress) => Promise<void>
  ) => Promise<void>;
}

function eventEmbedBuilder(
  title?: string, 
  desc?: string | null, 
  image?: AttachmentBuilder, 
  fields?: Array<EmbedField>, 
  eventType?: EventTypeEnum, 
  eventProgress?: EventProgress, 
  embedColor?: number
) {
  let embed = new EmbedBuilder()
    .setTitle(title || null)
    .setDescription(desc || null)
    .setColor(embedColor || 0x8ED3AA)
    .setThumbnail((image ? "attachment://" + fileName(image.attachment.toString()) : null) || null)

  if (fields) {
    embed.addFields(fields!.map((field: EmbedField) => {
      return ({ name: field.title, value: field.desc, inline: field.isSingleLine || false } as APIEmbedField)
    }))
    switch (eventType) {
      case EventTypeEnum.Daily: { 
        embed.addFields({ 
          name: "任務進度", 
          value: `共有${eventProgress?.finishedCount}位開拓者完成了任務`, 
          inline: false 
        } as APIEmbedField); 
        break; 
      }
      case EventTypeEnum.LimitTimeMission: { 
        embed.addFields({
          name: "任務進度", 
          value: eventProgressBarBuilder(eventProgress?.limitEventProgress || 0, eventProgress?.limitEventMax || 16) + `  ${eventProgress?.limitEventProgress || 0}/${eventProgress?.limitEventMax || 16}`, 
          inline: false 
        } as APIEmbedField); 
        break; 
      }
    }
  }

  return embed;
}

function eventProgressBarBuilder(current: number, total: number, size: number = 16, blockList: string[] = ["⬜","🟥","🟧","🟨","🟩"]) {
  if (total <= 0) total = 1; // 避免除以 0
  const progress = Math.round((current / total) * size);
  const cappedProgress = Math.max(0, Math.min(size, progress));

  // blockList[0] 為空格，之後依序為進度增加的符號
  // 將進度條劃分為 (blockList.length - 1) 個等分色階
  const levels = Math.max(1, blockList.length - 1);

  let bar = "";
  for (let i = 1; i <= size; i++) {
    if (i <= cappedProgress) {
      // 計算該格屬於哪個色階（1..levels）
      const colorIndex = Math.ceil((i * levels) / size);
      bar += blockList[colorIndex] ?? blockList[blockList.length - 1];
    } else {
      bar += blockList[0];
    }
  }

  return bar;
}

function eventButtonBuilder(text: string, style: ButtonStyle, id: string) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel(text)
    .setStyle(style)
}

// 為Embed添加互動式按鈕
export async function createInteractiveEventMessage(options: EmbedOptions) {
  const imageFile = options.imagePath ? new AttachmentBuilder(options.imagePath) : undefined;
  let currentProgress = options.initialProgress;

  const buildEmbed = (progress: EventProgress) => eventEmbedBuilder(
    options.title, options.desc, imageFile, options.fields, options.eventType, progress, options.embedColor
  );

  let missionEmbed = buildEmbed(currentProgress);

  const buttons = new ActionRowBuilder<MessageActionRowComponentBuilder>();
  options.choices.forEach((choice: string, indexBtn: number) => {
    const actionParam = options.choicesAction ? options.choicesAction[indexBtn] : `btn${indexBtn}`;
    buttons.addComponents(eventButtonBuilder(choice, ButtonStyle.Primary, `${options.missionId}_${actionParam}`));
  });

  return { embeds: [missionEmbed], files: [imageFile], components: [buttons], options: options };

}

export async function sendEmbedMessage(
  embed: { embeds: EmbedBuilder[], files: (AttachmentBuilder | undefined)[], components: ActionRowBuilder<MessageActionRowComponentBuilder>[], options: EmbedOptions },
) {
  const options = embed.options
  // 發送訊息
  let sentMessage: Message = await options.channel.send({ embeds: embed.embeds, components: embed.components, files: embed.files.filter(f => f !== undefined) });

  // 備份訊息 ID 與頻道 ID 到資料庫，以便未來恢復 Collector
  if (!options.missionId || !sentMessage.id || !options.channel.id) return sentMessage; // missionId 是可選的，但如果沒有就不紀錄了
  await saveMissionMessage(options.missionId, sentMessage.id, options.channel.id, options.expireTime);

  return sentMessage;
}

// 發送互動式事件訊息，並處理按鈕互動
export async function eventEmbedInteractiveHandler(
  options: EmbedOptions,
  sentMessage: Message,
  imageFile?: AttachmentBuilder
) {

  // 建立 Collector 監聽按鈕互動
  const collector = sentMessage.createMessageComponentCollector({ componentType: ComponentType.Button });
  const buildEmbed = (progress: EventProgress) => eventEmbedBuilder(
    options.title, options.desc, imageFile, options.fields, options.eventType, progress, options.embedColor
  );

  // 處理 Collector 收到的互動
  collector.on('collect', async (interaction) => {
    try {
      // interaction.customId 的格式為 missionId_actionParam，例如 dailymission_0_MISSION_FINISH
      // 將包含 Prefix 的 Custom ID 後面的動作解析出來，我們取後面的部分
      const action = interaction.customId.replace(options.missionId + '_', ''); // 例如 MISSION_FINISH

      const updateEmbed = async (newProgress: EventProgress) => {
        options.initialProgress = newProgress;
        const updatedEmbed = buildEmbed(options.initialProgress);
        await sentMessage.edit({ embeds: [updatedEmbed] });
      };

      await options.onInteraction(interaction, action, updateEmbed);
    } catch (err) {
      console.error(`Interaction Error in event ${options.title}:`, err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '處理任務時發生錯誤。', ephemeral: true });
      }
    }
  });

  return sentMessage;
}

// 恢復最近發送的 mission message 的 collectors（最多 recentHours 小時）
export async function restoreMissionCollectors(client: Client, recentHours: number = 24) {
  try {
    const since = Date.now() - recentHours * 60 * 60 * 1000;
    const rows = await getRecentMissionMessages(since);

    for (const row of rows) {
      try {
        const missionId: string = row.mission_id;
        const messageId: string = row.message_id;
        const channelId: string = row.channel_id;

        const channel = client.channels.cache.get(channelId) as TextChannel;
        if (!channel) {
          console.warn(`無法找到頻道 ${channelId}，跳過恢復 mission ${missionId}`);
          continue;
        }
        const message = await channel.messages.fetch(messageId);
        if (!message) {
          console.warn(`無法找到訊息 ${messageId}，跳過恢復 mission ${missionId}`);
          continue;
        }
        // missionId 格式為 type_index_timestamp，例如 dailymission_0_1697040000000
        const parts = missionId.split('_');
        if (parts.length < 3) {
          console.warn(`missionId ${missionId} 格式不正確，無法解析，跳過恢復`);
          continue;
        }

        const type = parts[0]; // 例如 dailymission
        const index = parseInt(parts[1]); // 例如 0

        // 根據 type 和 index 重新生成 Embed 的內容
        const result = (() => {
          switch (type) {
            case 'dailymission': {
              return generateDailyMissions(client, index, channel, missionId, row.expire_time);
            }
            case 'limittimemission': {
              return generateLimitTimeMissions(client, index, channel, missionId, row.expire_time);
            }
            default: {
              console.warn(`不支援的 mission type ${type}，跳過恢復`);
              return undefined;
            }
          }
        })();
        if (!result) continue;

        const embedData = await result;
        await eventEmbedInteractiveHandler(embedData.options, message, embedData.files[0]);
        
        console.log(`成功恢復 mission ${missionId} 的 Collector`);
      } catch (err) {
        console.error('restoreMissionCollectors 失敗', err);
      }
    }
  } catch (err) {
    console.error('從資料庫獲取最近 mission messages 失敗', err);
  }
}