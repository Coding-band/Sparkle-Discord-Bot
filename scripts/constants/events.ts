/**
 * All Events will be place at there, including Constants.
 */

import { APIEmbedField, ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, MessageActionRowComponentBuilder, TextChannel } from "discord.js"
import { EventInfo } from "./types";
import { mission_list as DailyMissionList} from "../../assets/json_data/daily_mission_list.json"
import { ColorConst } from "./constants";

export type EmbedField = {
  title: string;
  desc: string;
  isSingleLine: boolean;
}

const eventEmbedBuilder = (title?: string, desc?: string, image?: AttachmentBuilder, fields?: Array<EmbedField>, embedColor?: number) => {
  let embed =  new EmbedBuilder()
    .setTitle(title || "null")
    .setDescription(desc || "null")
    .setColor(embedColor || 0x8ED3AA)
    .setThumbnail((image ? "attachment://"+fileName(image.attachment.toString()) : null) || null)
  
    if(fields){
      embed.addFields(fields!.map((field: EmbedField) => {
        return ({ name: field.title, value: field.desc, inline: field.isSingleLine || false } as APIEmbedField)
      }))
    }

    return embed;
}

const eventButtonBuilder = (text : string, style : ButtonStyle, id : string) => {
  return new ButtonBuilder()
  .setCustomId(id)
  .setLabel(text)
  .setStyle(style)
}

export function generateDailyMissions(client: Client, counts: number = 4) {
  const channelGaming = client.channels.cache.get(process.env.GamingChannel!) as TextChannel;

  for (let index = 0; index < counts; index++) {
    const randomChoiceIndex = Math.min(Math.round(Math.random() * DailyMissionList.length), DailyMissionList.length-1);
    const randomChoiceMission = DailyMissionList[randomChoiceIndex];
    const imageFile = (randomChoiceMission.img ? new AttachmentBuilder('./assets/images/' + randomChoiceMission.img) : undefined);
    let missionEmbed = eventEmbedBuilder(
      randomChoiceMission.title,
      randomChoiceMission.desc,
      imageFile,
      undefined,
      ColorConst.EMBED_GAMING_DAILY_MISSION_COLOR
    )
    const buttons = new ActionRowBuilder<MessageActionRowComponentBuilder>()
    randomChoiceMission.choices.map((choice : string, indexBtn : number) => {
      buttons.addComponents(eventButtonBuilder(choice, ButtonStyle.Primary, "dailymission_"+index+"_btn"+indexBtn))
    })

    if(randomChoiceMission?.img){
      channelGaming.send({ embeds: [missionEmbed] , files: [imageFile!], components: [buttons]})
    }else{
      channelGaming.send({ embeds: [missionEmbed] })
    }
  }
}

const fileName = (image : string) => {
  const splitted = image!.split("/");
  return splitted[splitted.length - 1]
};