import Database from 'better-sqlite3';

export function createDatabase(databasePath) {
    const db = new Database(databasePath);

    db.pragma('journal_mode = WAL');

    db.exec(`
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            plan TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            amount REAL NOT NULL DEFAULT 0.00,
            duration_months INTEGER NOT NULL DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        );
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS setting (
            salle_name TEXT
        );
    `);

    const existingClient = db
        .prepare('SELECT COUNT(*) AS count FROM clients')
        .get();

    if (existingClient.count === 0) {
        db.prepare(`
            INSERT INTO clients
            (name, phone, plan, start_date, end_date, amount, duration_months)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            'yassine',
            '0693208317',
            'VIP',
            '2026-09-14',
            '2026-10-14',
            150.00,
            24
        );
    }

    const existingSetting = db
        .prepare('SELECT COUNT(*) AS count FROM setting')
        .get();

    if (existingSetting.count === 0) {
        db.prepare(`
            INSERT INTO setting (salle_name)
            VALUES (?)
        `).run('Gym Admin');
    }

    return db;
}