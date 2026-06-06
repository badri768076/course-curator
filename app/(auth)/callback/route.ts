import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // In production, we'd exchange code for session here
  // For dev/demo we just redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
