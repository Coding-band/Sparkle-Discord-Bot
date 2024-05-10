// Require the necessary discord.js classes
import { Client, Collection, Events, GatewayIntentBits, EmbedBuilder, TextChannel } from 'discord.js';
import { ColorConst, EnvConst } from './commands/constants/constants';
import CommandRegist from './commands/commandRegist';

//Expend a "Commannds" variable
//From https://stackoverflow.com/questions/62860164/stuck-with-adding-variable-to-discord-client-object-typescript
declare module "discord.js" {
    export interface Client {
        commands: Collection<unknown, any>
    }
}

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

//Regist Commands
client.commands = new Collection();
CommandRegist(client);

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	const channelNoti = client.channels.cache.get(process.env.AnnouncementChannel!) as TextChannel;
	var embed = new EmbedBuilder()
		.setColor(ColorConst.EMBED_ANNOUN_COLOR)
		.setTitle("重啟成功通知")
		.setDescription("我回來了！另外，所有指令將會在現在重新被執行。當前是在"+EnvConst.NODE_ENV);
	channelNoti.send({embeds: [embed]});
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try{
		await command.execute(interaction);
	}catch(error){
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		}else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on(Events.MessageCreate, message => {
	console.log(message.content)
	message.channel.send("DLL")
});


// Log in to Discord with your client's token
client.login(process.env.TOKEN_KEY);

