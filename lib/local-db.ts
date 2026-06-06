import fs from 'fs';
import path from 'path';

// Define the shape of our data
export interface UserProgress {
  userId: string;
  topicId: string;
  courseId: string;
  timeSpent: number; // in seconds
}

export interface DbSchema {
  progress: UserProgress[];
}

const dbDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'time-tracking.json');

// Initialize the database file if it doesn't exist
function initDb() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    const initialData: DbSchema = { progress: [] };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

// Read the database
export function readDb(): DbSchema {
  initDb();
  const fileData = fs.readFileSync(dbPath, 'utf-8');
  try {
    return JSON.parse(fileData) as DbSchema;
  } catch {
    return { progress: [] };
  }
}

// Write to the database
export function writeDb(data: DbSchema) {
  initDb();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}
