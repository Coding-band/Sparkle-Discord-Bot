import { Client, CommandInteraction, REST, Routes } from "discord.js";
import { CommandRegistType } from "./constants/types";
import PING from "./ping";

export const CommandList : Array<CommandRegistType> = [
    PING,
]

export default function CommandRegist(client : Client){
    let cmdSuccessRegist = 0
    CommandList.map((cmd : any) => {
        if(cmd !== undefined && cmd.data !== undefined){
            client.commands.set(cmd.data.name || "?", cmd)
            console.log(cmd)
            cmdSuccessRegist ++
        }
    })
    console.log("共有${1}項指令成功登錄".replace("${1}",cmdSuccessRegist.toString()))    
}