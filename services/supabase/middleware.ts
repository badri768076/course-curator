import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // Return the default response since we handle local session fallbacks gracefully
  return NextResponse.next();
}
