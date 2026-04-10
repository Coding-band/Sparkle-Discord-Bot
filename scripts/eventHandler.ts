
import { Client } from 'discord.js';
import cron from 'node-cron';
import { sendDailyMissions, sendLimitTimeMissions } from './constants/events';
import { startBackup } from './database';

/**
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *

 | field	| value |
 |----|----|
 | second	| 0-59 |
 | minute	| 0-59 |
 | hour	| 0-23 |
 | dom 	| 01月31日 |
 | month	| 1-12 (or names) |
 | dow |	0-7 (or names, 0 or 7 are sunday)|

 */

export default async function EventHandlersInit(client: Client) {
  // 每日任務 - 早上6點
  cron.schedule('0 0 6 * * *', () => {
    sendDailyMissions(client);
  }, {
    scheduled: true
  });

  // 每日備份 - 凌晨1點
  cron.schedule('0 0 0 * * *', () => {
    startBackup();
  }, {
    scheduled: true
  });

  // 限時任務 - 隨機時間 (15-60s) 觸發
  setTimeout(async() => {
    await sendLimitTimeMissions(client);
  }, 15 + Math.random() * 45000)

};