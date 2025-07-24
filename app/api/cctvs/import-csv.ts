import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // TODO: Implement CSV import logic
  return NextResponse.json({ success: true, message: 'CSV imported (stub)' });
} 