import { CommandInteraction, SlashCommandBuilder } from "discord.js"

export type CommandRegistType = {
    data : SlashCommandBuilder,
    execute : (interaction : CommandInteraction) => Promise<void>
}