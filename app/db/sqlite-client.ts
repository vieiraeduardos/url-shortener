import sqlite3 from "sqlite3";

sqlite3.verbose();

export default class SQLiteClient {
    private db: sqlite3.Database | null;

    constructor() {
        this.db = null;
    }

    async open_db(): Promise<sqlite3.Database> {
        if (!this.db) {
            this.db = new sqlite3.Database("url-shortener.db", (err) => {
                if (err) {
                    console.error("Error opening database:", err.message);
                }
            });

            await this.run(`
                CREATE TABLE IF NOT EXISTS urls (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url TEXT NOT NULL,
                    code TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expired_at TEXT NOT NULL
                )
            `);
        }
        return this.db;
    }

    close_db(): void {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error("Error closing database:", err.message);
                }
            });
            this.db = null;
        }
    }

    run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error("Database is not open"));
            }
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }

    async generate_short_link(item: { url: string; code: string; created_at: string; expired_at: string }): Promise<void> {
        await this.open_db();
        const sql = `INSERT INTO urls (url, code, created_at, expired_at) VALUES (?, ?, ?, ?)`;
        await this.run(sql, [item.url, item.code, item.created_at, item.expired_at]);
        this.close_db();
    }

    async get_url_from_code(item: { code: string }): Promise<any> {
        await this.open_db();
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error("Database is not open"));
            }
            this.db.get("SELECT * FROM urls WHERE code = ?", [item.code], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}