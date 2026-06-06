import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/local-db';

export async function POST(req: Request) {
  try {
    const { courseId, topicSlug, seconds } = await req.json();

    if (!courseId || !topicSlug || typeof seconds !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Use a default user ID since we are strictly local without Auth
    const userId = 'local_user';

    const db = readDb();
    
    // Find if the progress already exists
    const progressIndex = db.progress.findIndex(
      (p) => p.userId === userId && p.topicId === topicSlug
    );

    if (progressIndex >= 0) {
      // Update existing record
      db.progress[progressIndex].timeSpent += seconds;
    } else {
      // Create new record
      db.progress.push({
        userId,
        topicId: topicSlug,
        courseId,
        timeSpent: seconds,
      });
    }

    // Save back to local JSON file
    writeDb(db);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('track-time API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
