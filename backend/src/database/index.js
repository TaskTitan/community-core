import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize a single database with an absolute path
const db = new sqlite3.Database(path.join(__dirname, '../../user-database.db'));

// Function to create tables
function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS custom_tools (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT NOT NULL,
        description TEXT NOT NULL,
        parameters TEXT NOT NULL,
        outputs TEXT NOT NULL,
        created_by TEXT NOT NULL,
        is_shareable INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        workflow_data TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT DEFAULT 'stopped',
        is_shareable INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      db.run(`
        CREATE TABLE IF NOT EXISTS content_outputs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        workflow_id TEXT,
        tool_id TEXT,
        content TEXT NOT NULL,
        is_shareable INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (workflow_id) REFERENCES workflows(id)
      )`);

      db.run(
        `CREATE TABLE IF NOT EXISTS user_data (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        table_name TEXT NOT NULL,
        data JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  });
}

// Ensure tables are created before exporting the database
createTables()
  .then(() => {
    console.log('All tables created successfully');
  })
  .catch((error) => {
    console.error('Error creating tables:', error);
  });

export default db;
