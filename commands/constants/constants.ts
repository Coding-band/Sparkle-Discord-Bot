/**
 * This is the Constant Collection Class. 
 * All global constants (not include const in specific function) 
 * Will need to place in there
 */

/**
 * The key to let pm2 and ts-node both can run normally
 */
import ENV from "dotenv";
if(!process.env.NODE_ENV){
    ENV.config();
}

/**
 * This is the Constant Category of Color used in Embed 
 */
export const ColorConst = {
    SPARKLE_PATTLES : [0xB43353,0x3E2833,0xF5E6DC,0x842335,0x0a050a,0x41B7C5,0x5480B4,0x645270,0x68686D],
    EMBED_ANNOUN_COLOR : 0xb43353,
};

/**
 * This is the Constant Category of Bot Environment
 */
export const EnvConst = {
    NODE_ENV : process.env.NODE_ENV,
    TOKEN_KEY : process.env.TOKEN_KEY,
	
    AnnouncementChannel : process.env.AnnouncementChannel,
    CommandChannel : process.env.CommandChannel,
    DebugLogChannel : process.env.DebugLogChannel,
    GamingChannel : process.env.GamingChannel,
    BotID : process.env.BotID,
}