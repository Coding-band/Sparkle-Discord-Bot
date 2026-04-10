import { Client, TextChannel } from "discord.js"
import { EventInfo, EventTypeEnum } from "../constants/types";
import { mission_list as DailyMissionList } from "../../assets/json_data/daily_mission_list.json"
import { limited_time_mission_list as LimitedTimeMissionList } from "../../assets/json_data/limited_time_mission_list.json"
import { ColorConst } from "../constants/constants";
import { logDailyMission, hasUserDoneMission, getTodayMissionCount } from "../database";
import { createInteractiveEventMessage, EmbedOptions, eventEmbedInteractiveHandler, sendEmbedMessage } from "./eventBuilder";

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
