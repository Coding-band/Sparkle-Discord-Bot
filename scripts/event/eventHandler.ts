
import { Client } from 'discord.js';
import cron from 'node-cron';
import { sendDailyMissions, sendLimitTimeMissions } from './events';
import { startBackup, getRecentMissionMessages } from '../database';

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

  // 限時任務 - 檢查現有任務後觸發
  const checkExistingLimitTimeMissions = async () => {
    try {
      const since = Date.now() - 24 * 60 * 60 * 1000; // 過去24小時
      const recentMissions = await getRecentMissionMessages(since);
      const limitTimeMissions = recentMissions.filter((row: any) => 
        row.mission_id.startsWith('limittimemission') && row.expire_time > Date.now()
      );
      
      if (limitTimeMissions.length > 0) {
        // 找到最近過期的任務
        const latestExpireTime = Math.max(...limitTimeMissions.map((row: any) => row.expire_time));
        const remainingTime = latestExpireTime - Date.now();
        // 等待任務過期後，再加上隨機延遲 (1-4小時)
        const randomDelay = (1 + Math.random() * 3) * 60 * 60 * 1000;
        const totalDelay = remainingTime + randomDelay;
        console.log(`發現未過期的限時任務，等待 ${Math.floor(totalDelay / 1000 / 60)} 分鐘後開始新的限時任務循環`);
        return totalDelay;
      } else {
        // 沒有未過期的任務，立即開始
        return 15000 + Math.random() * 45000; // 15-60秒
      }
    } catch (err) {
      console.error('檢查現有限時任務失敗:', err);
      return 15000 + Math.random() * 45000; // 失敗時使用默認延遲
    }
  };

  const delay = await checkExistingLimitTimeMissions();
  setTimeout(async() => {
    await sendLimitTimeMissions(client);
  }, delay);
};