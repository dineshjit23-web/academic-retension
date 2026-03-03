
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'database.sqlite');

export async function initDB() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT,
      password TEXT,
      role TEXT DEFAULT 'student',
      reset_token TEXT,
      reset_expiry TEXT,
      phone TEXT,
      intensity TEXT,
      face_metadata TEXT,
      biometric_metadata TEXT
    );

    -- Ensure columns exist if table already existed
    PRAGMA table_info(users);

    CREATE TABLE IF NOT EXISTS concepts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      subject TEXT,
      description TEXT,
      difficulty TEXT,
      retention_score INTEGER,
      last_reviewed TEXT,
      next_review_date TEXT,
      status TEXT,
      is_official INTEGER DEFAULT 0,
      created_by TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      concept_id TEXT,
      date TEXT,
      score INTEGER,
      time_spent INTEGER,
      FOREIGN KEY(concept_id) REFERENCES concepts(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      date TEXT,
      status TEXT,
      semester TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      subject TEXT,
      due_date TEXT,
      status TEXT,
      marks INTEGER,
      semester TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      concept_id TEXT,
      question TEXT,
      options TEXT, -- JSON string
      correct_answer_index INTEGER,
      explanation TEXT,
      FOREIGN KEY(concept_id) REFERENCES concepts(id)
    );
  `);

  // Actual migration for existing DB
  try {
    await db.run('ALTER TABLE users ADD COLUMN phone TEXT');
  } catch (e) { }
  try {
    await db.run('ALTER TABLE users ADD COLUMN password TEXT');
  } catch (e) { }
  try {
    await db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'");
  } catch (e) { }
  try {
    await db.run('ALTER TABLE users ADD COLUMN reset_token TEXT');
  } catch (e) { }
  try {
    await db.run('ALTER TABLE users ADD COLUMN reset_expiry TEXT');
  } catch (e) { }

  try {
    await db.run('ALTER TABLE concepts ADD COLUMN is_official INTEGER DEFAULT 0');
  } catch (e) { }
  try {
    await db.run('ALTER TABLE concepts ADD COLUMN created_by TEXT');
  } catch (e) { }

  return db;
}
