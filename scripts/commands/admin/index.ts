import { 
    Client, 
    ChatInputCommandInteraction, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    TextChannel,
    ButtonInteraction
} from 'discord.js';
import { createInteractiveEventMessage, sendEmbedMessage, eventEmbedInteractiveHandler, EmbedOptions } from '../../event/eventBuilder';

// 產生 Admin Spam Warning 的方法，封裝以便發送與系統重啟時的恢復
export async function generateAdminSpamWarning(client: Client, channel: TextChannel, missionId: string, expireTime: number) {
    const embedItem = await createInteractiveEventMessage({
        missionId: missionId,
        expireTime: expireTime, 
        channel: channel,
        title: 'WARNING ⚠️',
        desc: '# 請不要在這邊發任何信息，否則會被封鎖\n# You will get ban if send message here\n## 試試就會逝逝\n## DO NOT TRY',
        embedColor: 0xff0000, // 紅色
        choices: ['DO NOT CLICK'],
        choicesAction: ['admin_spam_warning_button'],
        choicesStyle: [ButtonStyle.Danger], // 指定為紅色警告按鈕
        initialProgress: {},
        onInteraction: async (interaction, action, updateEmbed) => {
            if (action === 'admin_spam_warning_button') {
                try {
                    // 私信提醒用戶
                    await interaction.user.send("# 【Coding Band】AutoMod訊息\n花火提提你：請不要在那個頻道發訊息，否則會被封鎖！\nSparkle reminds you: Do not send messages in that channel, or you will get banned!");
                } catch (error) {
                    console.error('Error sending DM on spam button click:', error);
                    // 如果用戶關閉了私信，則在頻道內 ephemeral 回覆
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: `<@ ${interaction.user.id}>\n⚠️ 警告！請勿在該頻道發送訊息！\n⚠️ Warning! Do not send messages in this channel!`, ephemeral: true });
                    }
                }
            }
        }
    } as EmbedOptions);

    return embedItem;
}

// ---- Slash Command Handlers ----
export async function handleAddSpamButton(client: Client, interaction: ChatInputCommandInteraction) {
    // 取得指定頻道，未指定則使用當前頻道
    const channelOption = interaction.options.getChannel('channel');
    const targetChannel = (channelOption || interaction.channel) as TextChannel;
    
    // 檢查頻道是否可以發送訊息
    if (!targetChannel || !targetChannel.isTextBased()) {
        await interaction.reply({ content: '無效的頻道，請選擇文字頻道。', ephemeral: true });
        return;
    }

    try {
        // 設定幾乎無限的過期時間（100 年後）讓他持久生效
        const expireTime = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000;
        const missionId = `adminSpamWarning_0_${Date.now()}`;

        const embedData = await generateAdminSpamWarning(client, targetChannel, missionId, expireTime);
        const sentMessage = await sendEmbedMessage(embedData);
        await eventEmbedInteractiveHandler(embedData.options, sentMessage, embedData.files[0]);

        await interaction.reply({ content: `已成功在 ${targetChannel} 建立警告訊息與按鈕。`, ephemeral: true });
    } catch (error) {
        console.error('Error sending spam button:', error);
        await interaction.reply({ content: '發送訊息失敗，請檢查機器人在此頻道的權限。', ephemeral: true });
    }
}

// ---- Button Interaction Handlers ----
export async function handleAdminButtonInteraction(interaction: ButtonInteraction) {
    // 這個可以保留給其它非 Collector 型管理按鈕，或者移除處理 admin_spam_warning_button 的部分
    // 因為已經改由 Event Embed 的 Collector 取代處理了
}

export default { handleAddSpamButton, handleAdminButtonInteraction, generateAdminSpamWarning };
