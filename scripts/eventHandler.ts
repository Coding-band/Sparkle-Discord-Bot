
import { Client } from 'discord.js';
import cron from 'node-cron';
import { generateDailyMissions } from './constants/events';

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

export default async function EventHandlersInit(client : Client){
  //cron.schedule('0 0 6 * * *', () => {
  cron.schedule('0 10 2 * * *', () => {
    {
      //Schedule of DailyMission
      generateDailyMissions(client,1);
    }
    }, {
      scheduled: true
  });
}