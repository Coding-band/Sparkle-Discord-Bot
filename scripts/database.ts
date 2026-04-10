import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// 建立或連線到 SQLite 資料庫
const dbPath = path.resolve(path.join(process.cwd(), 'db'), 'sparkle.db');
const db = new sqlite3.Database(dbPath);

// 初始化資料庫資料表
export function initDatabase() {
    ensureDirectoryExists(path.join(process.cwd(), 'db'));
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS daily_mission_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                mission_id TEXT NOT NULL,
                timestamp INTEGER NOT NULL
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS mission_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mission_id TEXT NOT NULL UNIQUE,
                message_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                expire_time INTEGER NOT NULL,
                record_timestamp INTEGER NOT NULL
            )
        `);
    });
}

function ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
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
        db.run(`INSERT INTO daily_mission_logs (user_id, action, mission_id, timestamp) VALUES (?, ?, ?, ?)`,
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
            `SELECT COUNT(*) as count FROM daily_mission_logs WHERE user_id = ? AND mission_id = ?`,
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

        db.get(
            `SELECT COUNT(DISTINCT user_id) as count FROM daily_mission_logs WHERE mission_id = ? AND timestamp >= ?`,
            [missionId, startOfDay.getTime()],
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
        db.get(`SELECT mission_id, message_id, channel_id, timestamp FROM mission_messages WHERE mission_id = ?`, [missionId], (err, row) => {
            if (err) reject(err);
            else resolve(row || null);
        });
    });
}

// 儲存發送的任務訊息 mapping
export function saveMissionMessage(missionId: string, messageId: string, channelId: string, expireTime: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        db.run(`INSERT INTO mission_messages (mission_id, message_id, channel_id, expire_time, record_timestamp) VALUES (?, ?, ?, ?, ?)`,
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
        db.all(`SELECT mission_id, message_id, channel_id, expire_time, record_timestamp FROM mission_messages WHERE record_timestamp >= ?`, [sinceTimestamp], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}