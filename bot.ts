// Require the necessary discord.js classes
import { Client, Collection, Events, GatewayIntentBits, EmbedBuilder, TextChannel, AttachmentBuilder, REST, Routes } from 'discord.js';
import { ColorConst, DevTestChoice, EnvConst } from './scripts/constants/constants';
import commandRegist from './scripts/commandRegist';
import EventHandlersInit from './scripts/eventHandler';
import { generateDailyMissions } from './scripts/constants/events';
import { initDatabase } from './scripts/database';
import { sparkleAprilFools2025 } from './scripts/constants/specials';
import { autoBanSpammer } from './scripts/automod';

// 啟動與初始化資料庫
initDatabase();

// Create a new client instance
const client = new Client({ intents: [
	GatewayIntentBits.Guilds, 
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMessages, 
	GatewayIntentBits.DirectMessages]
});

// 擴充並初始化 commands 集合，供指令註冊與查找使用
client.commands = new Collection();

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
  } catch (error) {
    console.error(error);
  }

	//EventHandlersInit(readyClient);

	//generateDailyMissions(readyClient, 1)
	//sparkleAprilFools2025(channelCommand);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

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
});

// Log in to Discord with your client's token
client.login(process.env.TOKEN_KEY);

