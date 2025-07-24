import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // TODO: Implement CSV export logic
  return NextResponse.json({ success: true, message: 'CSV exported (stub)' });
} 