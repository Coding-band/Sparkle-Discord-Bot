import { Client, Collection, CommandInteraction, REST, Routes } from "discord.js";
import { CommandRegistType } from "./constants/types";
import fs from "fs";
import path from "path";
function getCommandFiles(dirPath: string): string[] {
  const files = [];
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getCommandFiles(fullPath));
    } else if (item.endsWith('commands.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

import { pathToFileURL } from 'url';

// 使用工作目錄來解析 commands 資料夾，避免 import.meta 在部分設定下不可用
const functionPath = path.join(process.cwd(), 'scripts', 'commands');
const commandFiles = getCommandFiles(functionPath);

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN_KEY!);

export default async function commandRegist(client: Client) {
  // 擴充並初始化 commands 集合，供指令註冊與查找使用
  client.commands = new Collection();

  let cmdSuccessRegist = 0;
  for (const filePath of commandFiles) {
    try {
      const moduleUrl = pathToFileURL(filePath).href;
      const mod = await import(moduleUrl);
      const commands = (mod && (mod.default ?? mod)) || mod;
      const commandArray = Array.isArray(commands) ? commands : [commands];

      for (const command of commandArray) {
        if (command && 'data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          cmdSuccessRegist++;
          console.log(`成功登錄指令: ${command.data.name}`);
        } else {
          console.log(`[警告] 指令 ${filePath} 中的一個命令缺少 "data" 或 "execute" 屬性。`);
        }
      }
    } catch (err) {
      console.error(`載入指令檔案失敗: ${filePath}`, err);
    }
  }

  const commandsData = Array.from(client.commands.values()).map(command => command.data.toJSON());

 await rest.put(
    Routes.applicationCommands(process.env.BotID!),
    { body: commandsData },
  );
  console.log(`共有${cmdSuccessRegist}項指令成功登錄`);
}