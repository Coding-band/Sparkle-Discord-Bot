/**
 * All Events will be place at there, including Constants.
 */

import { APIEmbedField, ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, MessageActionRowComponentBuilder, TextChannel } from "discord.js"
import { EventInfo, EventProgress, EventTypeEnum } from "./types";
import { mission_list as DailyMissionList } from "../../assets/json_data/daily_mission_list.json"
import { ColorConst } from "./constants";

//Global Event List
export let EventList : Array<EventInfo> = [];

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

export function generateDailyMissions(client: Client, counts: number = 4) {
  const channelGaming = client.channels.cache.get(process.env.GamingChannel!) as TextChannel;

  for (let index = 0; index < counts; index++) {
    const randomChoiceIndex = Math.min(Math.round(Math.random() * DailyMissionList.length), DailyMissionList.length - 1);
    const randomChoiceMission = DailyMissionList[randomChoiceIndex];
    const imageFile = (randomChoiceMission.img ? new AttachmentBuilder('./assets/images/' + randomChoiceMission.img) : undefined);
    let missionProgress : EventProgress = {
      dailyEventFinishedCount : 0
    }
    
    let missionEmbed = eventEmbedBuilder(
      "每日任務 (" + (index + 1) + "/" + counts + ")",
      null,
      imageFile,
      [{ title: randomChoiceMission.mission_title, desc: randomChoiceMission.mission_desc }] as Array<EmbedField>,
      EventTypeEnum.Daily,
      missionProgress,
      ColorConst.EMBED_GAMING_DAILY_MISSION_COLOR
    )
    const buttons = new ActionRowBuilder<MessageActionRowComponentBuilder>()
    randomChoiceMission.choices.map((choice: string, indexBtn: number) => {
      buttons.addComponents(eventButtonBuilder(choice, ButtonStyle.Primary, "dailymission_" + index + "_btn" + indexBtn))
    })

    if (randomChoiceMission?.img) {
      channelGaming.send({ embeds: [missionEmbed], files: [imageFile!], components: [buttons] })
    } else {
      channelGaming.send({ embeds: [missionEmbed] })
    }
  }
}

const fileName = (image: string) => {
  const splitted = image!.split("/");
  return splitted[splitted.length - 1]
};