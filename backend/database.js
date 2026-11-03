const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'contacts.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        email      TEXT    NOT NULL,
        phone      TEXT,
        company    TEXT,
        service    TEXT,
        subject    TEXT    NOT NULL,
        message    TEXT    NOT NULL,
        status     TEXT    NOT NULL DEFAULT 'new',
        created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
`);

const stmtInsert = db.prepare(`
    INSERT INTO contacts (name, email, phone, company, service, subject, message)
    VALUES (@name, @email, @phone, @company, @service, @subject, @message)
`);

const stmtGetAll = db.prepare(`
    SELECT * FROM contacts ORDER BY created_at DESC
`);

const stmtGetById = db.prepare(`SELECT * FROM contacts WHERE id = ?`);

const stmtUpdateStatus = db.prepare(`
    UPDATE contacts SET status = ? WHERE id = ?
`);

const insertContact     = (data) => stmtInsert.run(data);
const getAllContacts     = ()     => stmtGetAll.all();
const getContactById    = (id)   => stmtGetById.get(id);
const updateStatus      = (id, status) => stmtUpdateStatus.run(status, id);

module.exports = { insertContact, getAllContacts, getContactById, updateStatus };
