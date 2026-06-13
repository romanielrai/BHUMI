import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api';

async function handleProxy(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const method = request.method;
    let body: any = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.text();
        headers['Content-Type'] = 'application/json';
      } catch {
        body = undefined;
      }
    }

    const response = await fetch(`${API_URL}/auth/profile`, {
      method,
      headers,
      body,
    });

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const data = await response.text();
      return new NextResponse(data, {
        status: response.status,
        headers: { 'Content-Type': contentType || 'text/plain' },
      });
    }
  } catch (error) {
    console.error('NextJS Profile API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy profile request to API server.' },
      { status: 500 }
    );
  }
}

export {
  handleProxy as GET,
  handleProxy as PATCH,
};
