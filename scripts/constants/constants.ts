/**
 * This is the Constant Collection Class. 
 * All global constants (not include const in specific function) 
 * Will need to place in there
 */

/**
 * The key to let pm2 and ts-node both can run normally
 */
import ENV from "dotenv";
import { TextLanguage } from "./types";
if (!process.env.NODE_ENV) {
  ENV.config();
}

export const DevTestChoice = {
  DEVELOPMENT: "development_tsnode" || "development",
  PRODUCTION: "production" || "production_beta",
  isDisableOnlineEmbed: true,
}

/**
 * This is the Constant Category of Color used in Embed 
 */
export const ColorConst = {
  SPARKLE_PATTLES: [0xB43353, 0x3E2833, 0xF5E6DC, 0x842335, 0x0a050a, 0x41B7C5, 0x5480B4, 0x645270, 0x68686D],
  EMBED_ANNOUN_COLOR: 0xB43353,
  EMBED_GAMING_DAILY_MISSION_COLOR: 0x8ED3AA,
  EMBED_GAMING_LIMIT_MISSION_COLOR: 0xFF8B8B,
  EMBED_GAMING_CHALLEGEG_MISSION_COLOR: 0xFF7A00,
  EMBED_GAMING_DECISION_MISSION_COLOR: 0xB18ED3,
  EMBED_GAMING_LOTTERY_COLOR: 0x25D0F5,
};

/**
 * This is the Constant Category of Bot Environment
 */

export const EnvConst = {
  BotName: "焰錦遊魚",
  NODE_ENV: process.env.NODE_ENV,
  TOKEN_KEY: process.env.TOKEN_KEY,

  AnnouncementChannel: process.env.AnnouncementChannel,
  CommandChannel: process.env.CommandChannel,
  DebugLogChannel: process.env.DebugLogChannel,
  GamingChannel: process.env.GamingChannel,
  BotID: process.env.BotID,
}

/**
 * This is the Constant Category of Language, which is for future locale translation usage
 * NOT IN USE NOW
 */
export const LanguageList: TextLanguage[] = [
  { langCode: "en", langLocaleName: "English" } as TextLanguage,
  { langCode: "zh_hk", langLocaleName: "繁體中文" } as TextLanguage,
  { langCode: "zh_cn", langLocaleName: "简体中文" } as TextLanguage,
  { langCode: "jp", langLocaleName: "日本語" } as TextLanguage,
  { langCode: "fr", langLocaleName: "Français" } as TextLanguage,
  { langCode: "ru", langLocaleName: "Русский" } as TextLanguage,
  { langCode: "pt", langLocaleName: "Português" } as TextLanguage,
  { langCode: "vi", langLocaleName: "tiếng Việt" } as TextLanguage,
  { langCode: "es", langLocaleName: "Español" } as TextLanguage,
  { langCode: "th", langLocaleName: "ภาษาไทย" } as TextLanguage,
  { langCode: "uk", langLocaleName: "Українська" } as TextLanguage,
]

export const GreetingConst = {
  morning_words : ["morning","gm","早晨","早","早安","安安"],
  afternoon_words: ["afternoon","晏晝","午","午安","下午好"],
  night_words : ["good night","gn","早唞","晚","晚安","晚上好"],

  morning_reaction : ["🌞","☀️","🌅","🌄","🌤","🌤️","⛅"],
  afternoon_reaction : ["🍮","🍚","🍜","🍛","🧋","🏙️"],
  night_reaction : ["🌛","🌜","⭐","🌕","🌅","🌄","🌃","🌉"],
}