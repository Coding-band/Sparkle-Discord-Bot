import sqlite3 from 'sqlite3';
import path from 'path';

// 建立或連線到 SQLite 資料庫
const dbPath = path.resolve(process.cwd(), 'sparkle.sqlite');
const db = new sqlite3.Database(dbPath);

// 初始化資料庫資料表
export function initDatabase() {
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
        // 嘗試加入 mission_id 欄位（針對已經存在的資料表更新）
        db.run(`ALTER TABLE daily_mission_logs ADD COLUMN mission_id TEXT DEFAULT ''`, (err) => {
            // 如果欄位已存在會拋出錯誤，可以直接忽略
        });
    });
}

// 寫入任務互動紀錄
export function logDailyMission(userId: string, action: string, missionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        db.run(`INSERT INTO daily_mission_logs (user_id, action, mission_id, timestamp) VALUES (?, ?, ?, ?)`, 
            [userId, action, missionId, timestamp], 
            function(err) {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// 檢查用戶今天是否已經完成該任務（基於 mission_id）
export function hasUserDoneMissionToday(userId: string, missionId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        db.get(
            `SELECT COUNT(*) as count FROM daily_mission_logs WHERE user_id = ? AND mission_id = ? AND timestamp >= ?`,
            [userId, missionId, startOfDay.getTime()],
            (err, row: any) => {
                if (err) reject(err);
                else resolve(row.count > 0);
            }
        );
    });
}

// 取得今天完成該任務的總人數（基於 mission_id）
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