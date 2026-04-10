// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits, EmbedBuilder, TextChannel } from 'discord.js';
import { ColorConst, DevTestChoice, EnvConst } from './scripts/constants/constants';
import commandRegist from './scripts/commandRegist';
import EventHandlersInit from './scripts/event/eventHandler';
import { initDatabase, initServerDbSetup } from './scripts/database';
import { sparkleAprilFools2025 } from './scripts/specials';
import { autoBanSpammer } from './scripts/automod';
import { restoreMissionCollectors } from './scripts/event/eventBuilder';
import { greetingsReward } from './scripts/greetings';

// 啟動與初始化資料庫
initDatabase();

// Create a new client instance
const client = new Client({ intents: [
	GatewayIntentBits.Guilds, 
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMessages, 
	GatewayIntentBits.DirectMessages]
});

client.once(Events.ClientReady, async (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	const channelNoti = readyClient.channels.cache.get(process.env.AnnouncementChannel!) as TextChannel;
	const channelCommand = readyClient.channels.cache.get(process.env.CommandChannel!) as TextChannel;

	var embed = new EmbedBuilder()
		.setColor(ColorConst.EMBED_ANNOUN_COLOR)
		.setTitle("重啟成功通知")
		.setDescription("我回來了！另外，所有指令將會在現在重新被執行。當前是在" + EnvConst.NODE_ENV);
	if (EnvConst.NODE_ENV !== DevTestChoice.DEVELOPMENT || (!DevTestChoice.isDisableOnlineEmbed && EnvConst.NODE_ENV === DevTestChoice.DEVELOPMENT)) {
		channelNoti.send({ embeds: [embed] });
	}

	try {
    console.log('開始刷新應用程式 (/) 指令。');
		await commandRegist(readyClient);
    console.log('成功重新載入應用程式 (/) 指令。');

		console.log('開始初始化資料庫伺服器專用資料表。');
		initServerDbSetup("1238442418819305536");
		console.log('成功初始化資料庫伺服器專用資料表。');
  } catch (error) {
    console.error(error);
  }

	// 恢復離線期間發送但仍在可恢復時限內的任務 collectors（最多 24 小時）
	try {
		await restoreMissionCollectors(readyClient, 24);
		console.log('已嘗試恢復最近任務 collectors');
	} catch (e) {
		console.error('恢復 collectors 發生錯誤', e);
	}

	EventHandlersInit(readyClient);

	//generateDailyMissions(readyClient, 1)
	//sparkleAprilFools2025(channelCommand);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = (interaction.client as any).commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on(Events.MessageCreate, async (message) => {
	//Auto Ban Spammer
	await autoBanSpammer(client, message, process.env.SpammerChannel!, process.env.AutoModChannel!);

	//Greetings Reward
	await greetingsReward(client, message, process.env.GeneralChannels as unknown as string[]);
});

// Log in to Discord with your client's token
client.login(process.env.TOKEN_KEY);

