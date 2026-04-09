import { Collection, CommandInteraction, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js";
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
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
  const functionPath = path.join(process.cwd(), 'scripts', 'commands');
  function getCommandFiles(dirPath: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) files.push(...getCommandFiles(fullPath));
      else if (item.endsWith('.js') || item.endsWith('.ts')) files.push(fullPath);
    }
    return files;
  }

  const commandFiles = getCommandFiles(functionPath);
  // commandFiles will be resolved and imported in the async IIFE below
  for (const _ of commandFiles) {
    // placeholder to keep block structure; actual import happens below
  }
  // we'll import and fill `commands` inside the async IIFE below
}

(async () => {
  try {
    // Discover and import command modules
    const functionPath = path.join(process.cwd(), 'scripts', 'commands');
    function getCommandFiles(dirPath: string): string[] {
      const files: string[] = [];
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) files.push(...getCommandFiles(fullPath));
        else if (item.endsWith('.js') || item.endsWith('.ts')) files.push(fullPath);
      }
      return files;
    }

    const fileList = getCommandFiles(functionPath);
    for (const filePath of fileList) {
      try {
        const mod = await import(pathToFileURL(filePath).href);
        const commandsMod = mod.default ?? mod;
        const arr = Array.isArray(commandsMod) ? commandsMod : [commandsMod];
        for (const cmd of arr) {
          if (cmd && cmd.data) commands.push(cmd.data.toJSON());
        }
      } catch (err) {
        console.error('載入指令以部署時發生錯誤:', filePath, err);
      }
    }

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