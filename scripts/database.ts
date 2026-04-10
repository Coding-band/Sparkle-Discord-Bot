import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { UserData } from './constants/types';
import { Client } from 'discord.js';

// 建立或連線到 SQLite 資料庫
const dbPath = path.resolve(path.join(process.cwd(), 'db'), 'sparkle.db');
const db = new sqlite3.Database(dbPath);

// 初始化資料庫資料表
export function initDatabase() {
    ensureDirectoryExists(path.join(process.cwd(), 'db'));
    db.serialize(() => {
        // 任務互動紀錄表
        db.run(`
            CREATE TABLE IF NOT EXISTS mission_react_record (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                mission_id TEXT NOT NULL,
                optained_coin INTEGER DEFAULT 0,
                timestamp INTEGER NOT NULL
            )
        `);

        // 任務訊息紀錄表（用於對應 mission_id 與 message_id 以便恢復 collectors）
        db.run(`
            CREATE TABLE IF NOT EXISTS mission_list (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mission_id TEXT NOT NULL UNIQUE,
                message_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                expire_time INTEGER NOT NULL,
                record_timestamp INTEGER NOT NULL
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS record (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                action_detail TEXT,
                channel_id TEXT,
                timestamp INTEGER NOT NULL
            )
        `);
    });
}

function ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// 初始化伺服器專用資料表 - 目前先只在Coding Band使用，之後如果有需要再改成更通用的版本
export function initServerDbSetup(guildId: string = process.env.GuildID!) {
    ensureDirectoryExists(path.join(process.cwd(), 'db'));
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS server_${guildId}_data (
            user_id TEXT PRIMARY KEY,
            user_coin INTEGER DEFAULT 0,
            user_text_counts INTEGER DEFAULT 0,
            user_voice_counts INTEGER DEFAULT 0,
            user_exp INTEGER DEFAULT 0,
            user_item_list TEXT,
            last_greeting_timestamp INTEGER DEFAULT 0
        )`);
    });
}

export function startBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-MM-SS
    const backupFileName = `sparkle_backup_${timestamp}.db`;
    const localBackupDir = path.resolve(process.cwd(), process.env.LocalBackupDir || './db/backups');
    const externalBackupDir = process.env.ExternalBackupDir ? path.resolve(process.cwd(), process.env.ExternalBackupDir) : undefined;

    // 確保本地備份目錄存在
    ensureDirectoryExists(localBackupDir);
    try {
        fs.copyFileSync(dbPath, path.join(localBackupDir, backupFileName));
        console.log(`本地資料庫備份成功: ${path.join(localBackupDir, backupFileName)}`);
    } catch (error) {
        console.error(`本地備份失敗: ${error}`);
    }

    // 如果設定了外部備份目錄，則也進行備份
    if (externalBackupDir) {
        ensureDirectoryExists(externalBackupDir);
        try {
            fs.copyFileSync(dbPath, path.join(externalBackupDir, backupFileName));
            console.log(`外部資料庫備份成功: ${path.join(externalBackupDir, backupFileName)}`);
        } catch (error) {
            console.error(`外部備份失敗: ${error}`);
        }
    }
}

// 寫入任務互動紀錄
export function logDailyMission(userId: string, action: string, missionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        db.run(`INSERT INTO mission_react_record (user_id, action, mission_id, timestamp) VALUES (?, ?, ?, ?)`,
            [userId, action, missionId, timestamp],
            function (err) {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// 檢查用戶是否已經完成該任務（基於 message_id）
export function hasUserDoneMission(userId: string, missionId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT COUNT(*) as count FROM mission_react_record WHERE user_id = ? AND mission_id = ?`,
            [userId, missionId],
            (err, row: any) => {
                if (err) reject(err);
                else resolve(row.count > 0);
            }
        );
    });
}

// 取得今天完成該任務的總人數（基於 message_id）
export function getTodayMissionCount(missionId: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        db.get(
            `SELECT COUNT(DISTINCT user_id) as count FROM mission_react_record WHERE mission_id = ? AND timestamp >= ? AND timestamp <= ?`,
            [missionId, startOfDay.getTime(), endOfDay.getTime()],
            (err, row: any) => {
                if (err) reject(err);
                else resolve(row.count);
            }
        );
    });
}

// 根據 mission_id 取得對應的訊息 ID 和頻道 ID
export function getMissionMessage(missionId: string): Promise<any | null> {
    return new Promise((resolve, reject) => {
        db.get(`SELECT mission_id, message_id, channel_id, timestamp FROM mission_list WHERE mission_id = ?`, [missionId], (err, row) => {
            if (err) reject(err);
            else resolve(row || null);
        });
    });
}

// 儲存發送的任務訊息 mapping
export function saveMissionMessage(missionId: string, messageId: string, channelId: string, expireTime: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        db.run(`INSERT INTO mission_list (mission_id, message_id, channel_id, expire_time, record_timestamp) VALUES (?, ?, ?, ?, ?)`,
            [missionId, messageId, channelId, expireTime, timestamp],
            function (err) {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// 取得最近的任務訊息列表（例如過去 24 小時內）
export function getRecentMissionMessages(sinceTimestamp: number): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
        db.all(`SELECT mission_id, message_id, channel_id, expire_time, record_timestamp FROM mission_list WHERE record_timestamp >= ?`, [sinceTimestamp], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

// 取得用戶資料
export function getUserData(userId: string, guildId: string): Promise<any | null> {
    return new Promise((resolve, reject) => {
        // Check whether the server-specific table exists before querying, if not exist then create one and return null
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='server_${guildId}_data'`, (err, row) => {
            if (err) {
                reject(err);
            } else if (!row) {
                // 如果表不存在，先創建表
                initServerDbSetup(guildId);
                resolve(null); // 表剛創建，沒有資料，返回 null
            } else {
                // 表存在，正常查詢用戶資料
                db.get(`SELECT * FROM server_${guildId}_data WHERE user_id = ?`, [userId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                });
            }
        });
    });
}

export async function updateUserData(
    userId: string,
    guildId: string,
    data: Partial<UserData>
): Promise<void> {
    const existingData = await getUserData(userId, guildId);

    return new Promise((resolve, reject) => {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map(col => `${col} = ?`).join(', ');

        if (!existingData) {
            db.run(`INSERT INTO server_${guildId}_data (user_id, user_coin, user_exp, user_text_counts, user_voice_counts, user_item_list, last_greeting_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,                     // user_id
                    (data as any).user_coin || 0, // user_coin
                    (data as any).user_exp || 0,  // user_exp
                    (data as any).user_text_counts || 0, // user_text_counts
                    (data as any).user_voice_counts || 0, // user_voice_counts
                    JSON.stringify(data.userItemList || []), // user_item_list
                    (data as any).last_greeting_timestamp || 0, // last_greeting_timestamp
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        } else {
            db.run(`UPDATE server_${guildId}_data SET ${setClause} WHERE user_id = ?`, [...values, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        }
    });
}

// 修改用戶的金幣數量，並返回修改後的金幣總數
export async function modifyUserCoin(userId: string, guildId: string, amount: number): Promise<number> {
    const userCurrCoin = await getUserData(userId, guildId).then((userData: any) => userData?.user_coin || 0)
    await updateUserData(userId, guildId, {user_coin: userCurrCoin + amount} as Partial<UserData>);
    return Promise.resolve(userCurrCoin + amount);
}

// 檢查＆更新打招呼的時間戳，確保同一個時間段內只能獲得一次獎勵
export async function checkAndUpdateGreetingMs(userId: string, guildId: string) {
    // 早上是 5 點到 12 點，下午是 12 點到 18 點，晚上是 18 點到 5 點
    const currTimestamp = Date.now();
    const currHour = new Date(currTimestamp).getHours();

    // 先檢查用戶資料中 last_greeting_timestamp 是否在今天的同一個時間段內
    const userInfo = await getUserData(userId, guildId) || null;
    if(!userInfo) {
        // 如果沒有用戶資料，直接透過 updateUserData 建立一筆新的資料，並且給予獎勵
        await updateUserData(userId, guildId, { last_greeting_timestamp: currTimestamp } as any);
    }

    const lastGreetingTimestamp = userInfo ? userInfo.last_greeting_timestamp : 0;

    let timeRangeStart: number;
    let timeRangeEnd: number;
    if (currHour >= 5 && currHour < 12) {
        // 早上
        timeRangeStart = new Date().setHours(5, 0, 0, 0);
        timeRangeEnd = new Date().setHours(11, 59, 59, 999);
    } else if (currHour >= 12 && currHour < 18) {
        // 下午
        timeRangeStart = new Date().setHours(12, 0, 0, 0);
        timeRangeEnd = new Date().setHours(17, 59, 59, 999);
    } else {
        // 晚上
        timeRangeStart = new Date().setHours(18, 0, 0, 0);
        timeRangeEnd = new Date().setHours(4, 59, 59, 999) + 24 * 60 * 60 * 1000; // 跨天的時間段
    }

    // 如果 last_greeting_timestamp 在當前時間段內，則不更新，否則更新為當前時間戳
    if (lastGreetingTimestamp && lastGreetingTimestamp >= timeRangeStart && lastGreetingTimestamp <= timeRangeEnd) {
        return false; // 不更新，已經在同一時間段內打過招呼了
    } else {
        db.run(`UPDATE server_${guildId}_data SET last_greeting_timestamp = ? WHERE user_id = ?`, [currTimestamp, userId]);
        return true; // 更新成功，可以給予獎勵
    }
}