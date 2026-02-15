import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieName, getSessionToken } from '../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    const correctPin = process.env.DASHBOARD_PIN || '0000';

    if (pin === correctPin) {
      const response = NextResponse.json({ success: true });
      response.cookies.set(getSessionCookieName(), getSessionToken(), {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid PIN' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(getSessionCookieName());
  return response;
}
