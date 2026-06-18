import { NextRequest, NextResponse } from 'next/server';

// This catch-all handles any /api/* routes not covered by specific route files.
// In production (Vercel), all backend logic lives in the Next.js API routes above — 
// this fallback ensures unmatched routes return a proper JSON error instead of HTML.
async function handler(request: NextRequest) {
  return NextResponse.json(
    { error: 'API endpoint not found', path: request.nextUrl.pathname },
    { status: 404 }
  );
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
