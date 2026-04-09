/**
 * All Events will be place at there.
 */

import { APIEmbedField, ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, MessageActionRowComponentBuilder, TextChannel, ComponentType, Message, ButtonInteraction } from "discord.js"
import { EventInfo, EventProgress, EventTypeEnum } from "./types";
import { mission_list as DailyMissionList } from "../../assets/json_data/daily_mission_list.json"
import { ColorConst } from "./constants";
import { logDailyMission, hasUserDoneMissionToday, getTodayMissionCount } from "../database";

//Global Event List
export let EventList: Array<EventInfo> = [];

// 生成每日任務
export async function generateDailyMissions(client: Client, counts: number = 4) {
  const channelGaming = client.channels.cache.get(process.env.GamingChannel!) as TextChannel;

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const baseMissionId = `dailymission_${yyyy}${mm}${dd}_${hh}${min}`;

  for (let index = 0; index < counts; index++) {
    const randomChoiceIndex = Math.min(Math.round(Math.random() * DailyMissionList.length), DailyMissionList.length - 1);
    const randomChoiceMission = DailyMissionList[randomChoiceIndex];
    const imagePath = randomChoiceMission.img ? './assets/images/' + randomChoiceMission.img : undefined;

    const missionId = `${baseMissionId}_${index}`;

    // 初始化從資料庫取得今天的完成人數
    let currentFinishedCount = 0;
    if (randomChoiceMission.choices_action?.includes("MISSION_FINISH")) {
      try {
        currentFinishedCount = await getTodayMissionCount(missionId);
      } catch (e) {
        console.error(e);
      }
    }

    // 建立互動式任務訊息
    await createInteractiveEventMessage({
      channel: channelGaming,
      title: `每日任務 (${index + 1}/${counts})`,
      imagePath: imagePath,
      fields: [{ title: randomChoiceMission.mission_title, desc: randomChoiceMission.mission_desc, isSingleLine: false }],
      eventType: EventTypeEnum.Daily,
      initialProgress: { dailyEventFinishedCount: currentFinishedCount },
      embedColor: ColorConst.EMBED_GAMING_DAILY_MISSION_COLOR,
      buttonPrefix: `dailymission_${index}`,
      choices: randomChoiceMission.choices,
      choicesAction: randomChoiceMission.choices_action,
      onInteraction: async (interaction, action, updateEmbed) => {
        switch (action) {
          case "MISSION_FINISH": {
            // 檢查使用者是否已經完成過任務了，避免重複完成
            const hasDone = await hasUserDoneMissionToday(interaction.user.id, missionId);
            if (hasDone) {
              await interaction.reply({ content: '您已經點擊過這個任務的幫忙按鈕囉！', ephemeral: true });
              return;
            }

            // 紀錄進資料庫
            await logDailyMission(interaction.user.id, action, missionId);
            const currentPeopleCount = await getTodayMissionCount(missionId);

            // 更新 Embed
            await updateEmbed({ dailyEventFinishedCount: currentPeopleCount });

            // 回覆使用者
            await interaction.reply({ content: randomChoiceMission.choices_reply.replace('{count}', currentPeopleCount.toString()), ephemeral: true });
            break;
          }
        }
      }
    });
  }
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

function eventEmbedBuilder(title?: string, desc?: string | null, image?: AttachmentBuilder, fields?: Array<EmbedField>, eventType?: EventTypeEnum, eventProgress?: EventProgress, embedColor?: number) {
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
      case EventTypeEnum.Daily: { embed.addFields({ name: "任務進度", value: `共有${eventProgress?.dailyEventFinishedCount}位開拓者完成了任務`, inline: false } as APIEmbedField); break; }
    }
  }

  return embed;
}

function eventButtonBuilder(text: string, style: ButtonStyle, id: string) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel(text)
    .setStyle(style)
}

export async function createInteractiveEventMessage(options: {
  channel: TextChannel;
  title: string;
  desc?: string | null;
  imagePath?: string;
  fields?: Array<EmbedField>;
  eventType: EventTypeEnum;
  initialProgress: EventProgress;
  embedColor?: number;
  buttonPrefix: string;
  choices: string[];
  choicesAction?: string[];
  onInteraction: (
    interaction: ButtonInteraction,
    action: string,
    updateEmbed: (newProgress: EventProgress) => Promise<void>
  ) => Promise<void>;
}) {
  const imageFile = options.imagePath ? new AttachmentBuilder(options.imagePath) : undefined;
  let currentProgress = options.initialProgress;

  const buildEmbed = (progress: EventProgress) => eventEmbedBuilder(
    options.title, options.desc, imageFile, options.fields, options.eventType, progress, options.embedColor
  );

  let missionEmbed = buildEmbed(currentProgress);

  const buttons = new ActionRowBuilder<MessageActionRowComponentBuilder>();
  options.choices.forEach((choice: string, indexBtn: number) => {
    const actionParam = options.choicesAction ? options.choicesAction[indexBtn] : `btn${indexBtn}`;
    buttons.addComponents(eventButtonBuilder(choice, ButtonStyle.Primary, `${options.buttonPrefix}_${actionParam}`));
  });

  let sentMessage: Message;
  if (imageFile) {
    sentMessage = await options.channel.send({ embeds: [missionEmbed], files: [imageFile], components: [buttons] });
  } else {
    sentMessage = await options.channel.send({ embeds: [missionEmbed], components: [buttons] });
  }

  const collector = sentMessage.createMessageComponentCollector({ componentType: ComponentType.Button });

  collector.on('collect', async (interaction) => {
    try {
      const parts = interaction.customId.split('_');
      // 將包含 Prefix 的 Custom ID 後面的動作解析出來，例如 prefix 為 dailymission_0，我們取後面的部分
      const action = parts.slice(parts.indexOf(options.buttonPrefix.split('_')[1]) + 1).join('_');

      const updateEmbed = async (newProgress: EventProgress) => {
        currentProgress = newProgress;
        const updatedEmbed = buildEmbed(currentProgress);
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