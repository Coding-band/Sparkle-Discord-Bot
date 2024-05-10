import { CommandInteraction, CommandInteractionOption, SlashCommandBuilder } from "discord.js"

export type CommandRegistType = {
    name? : string | "unknown", 
    localeName? : string | "未知", 
    data : SlashCommandBuilder,
    execute : ((interaction : CommandInteraction) => Promise<void>)
}

export type TextLanguage = {
    langCode : string;
    langLocaleName : string;
}