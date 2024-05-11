import { Collection, CommandInteraction, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js";
import { CommandList } from "./scripts/commandRegist";
import { CommandRegistType } from "./scripts/constants/types";
import { EnvConst } from "./scripts/constants/constants";

declare module "discord.js" {
  export interface Client {
    commands: Collection<unknown, any>
  }
}

const rest = new REST().setToken(process.env.TOKEN_KEY!);

let commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
{
  CommandList.map((cmd: CommandRegistType) => {
    if (cmd !== undefined && cmd.data !== undefined) {
      commands.push(cmd.data.toJSON())
    }
  })
}

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationCommands(EnvConst.BotID!),
      { body: commands },
    );

    console.log(`Successfully reloaded ${commands.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();