import { NextResponse } from 'next/server';
import { readDb } from '@/lib/local-db';

export async function GET() {
  try {
    const userId = 'local_user'; // Matches what we set in track-time route
    const db = readDb();

    // Sum up all timeSpent for this user
    const totalSeconds = db.progress
      .filter((p) => p.userId === userId)
      .reduce((sum, p) => sum + p.timeSpent, 0);

    return NextResponse.json({ totalSeconds });
  } catch (err) {
    console.error('user-time API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
