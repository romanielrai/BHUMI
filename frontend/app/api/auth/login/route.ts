import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      let data;
      try {
        data = contentType?.includes('application/json') ? await response.json() : { error: 'Login failed' };
      } catch {
        data = { error: 'Login failed' };
      }
      return NextResponse.json(
        { error: data.error || 'Login failed' },
        { status: response.status }
      );
    }

    if (!contentType?.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to API server. Is the backend running on port 4000?' },
      { status: 500 }
    );
  }
}
