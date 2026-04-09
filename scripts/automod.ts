import { APIEmbedField, ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, MessageActionRowComponentBuilder, TextChannel, ComponentType, Message, ButtonInteraction, Events } from "discord.js"
import { ColorConst } from "./constants/constants";

// 當有人在指定垃圾頻道發任何訊息時，就自動停權他，並刪除他過去4小時發的訊息，並dm説明原因
export async function autoBanSpammer(client: Client, message: Message, spamChannelId: string, recordChannelId: string) {
  // 忽略機器人自身的訊息
  if (message.author.bot) return;
  // 確認是否為指定的垃圾頻道
  if (message.channelId !== spamChannelId) return;

  const reasonDM = "# 【Coding Band】AutoMod訊息\n"+
        "由於您在【這裏發訊息會被封鎖】頻道中發送訊息，已自動將您停權。若有誤判請聯繫管理員。\n"+
        "-# Since you sent a message in the 【這裏發訊息會被封鎖】 channel, you have been automatically banned. If this is a mistake, please contact the administrators.";

  const reasonGuild = "Sent a message in the 【這裏發訊息會被封鎖】 channel, triggering an auto-ban by Sparkle Bot.";

  try {
    // 在公會中停權該用戶，並刪除過去指定時間的訊息
    const removeTime = 1 * 60 * 60; // 1 小時 
    const messageContent = message.content;

    if (message.guild) {
      //檢查是否有權限Ban該用戶
      const member = await message.guild.members.fetch(message.author.id);
      if (member && message.guild.members.me?.permissions.has("BanMembers")) {
        await message.guild.members.ban(message.author.id, {
          deleteMessageSeconds: removeTime,
          reason: reasonGuild,
        });
        console.log(`已自動封鎖垃圾訊息發送者: ${message.author.tag}`);
      } else {
        // 僅刪除該用戶在不同頻道發送的相同訊息
        try {
          for (const [, ch] of message.guild.channels.cache) {
            // 只處理文字頻道，且跳過觸發的垃圾頻道
            if ((ch as any).isText && !(ch as any).isText()) continue;

            try {
              const textCh = ch as TextChannel;

              // 檢查機器人在該頻道是否有刪除訊息權限
              const me = message.guild.members.me;
              if (!textCh.permissionsFor || !me || !textCh.permissionsFor(me).has("ManageMessages")) continue;

              // 取得近期訊息（最多 100 則），然後過濾出指定時間內、同一作者且內容相同的訊息
              const fetched = await textCh.messages.fetch({ limit: 100 });
              const toDelete = fetched.filter(m => {
                return (
                  m.author.id === message.author.id &&
                  m.id !== message.id &&
                  m.createdTimestamp >= (Date.now() - removeTime * 1000) &&
                  m.content === message.content
                );
              });

              for (const [, delMsg] of toDelete) {
                try {
                  await delMsg.delete();
                } catch (err) {
                  // 無法刪除則跳過
                }
              }
            } catch (innerErr) {
              // 單一頻道錯誤不影響其他頻道
            }
          }
        } catch (err) {
          // 忽略整體例外
        }
      }
    }

    // 嘗試 DM 說明原因
    try {
      await message.author.send(reasonDM);
    } catch (dmError) {
      // No action needed.
    }

    // 發送信息給管理員頻道
    const recordChannel = client.channels.cache.get(process.env.AutoModChannel!) as TextChannel;
    if (recordChannel) {
      await recordChannel.send(
        `[AutoMod] 用戶 \"${message.author.displayName}\" (${message.author.tag}) 在 <#${spamChannelId}> 發送垃圾訊息，已被自動停權。`
        +`\n-# [AutoMod] User \"${message.author.displayName}\" (${message.author.tag}) has sent spam message in <#${spamChannelId}> and has been banned.`
      + "\n```" + messageContent + "```"
      );
    }


  } catch (error) {
    // console.error("執行 autoBanSpammer 時發生錯誤:", error);
  }
}