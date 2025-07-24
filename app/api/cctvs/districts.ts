import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // TODO: Implement logic to fetch all districts
  return NextResponse.json({ districts: [], message: 'Districts fetched (stub)' });
} 