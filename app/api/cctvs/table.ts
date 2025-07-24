import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // TODO: Implement DynamoDB table creation logic
  return NextResponse.json({ success: true, message: 'CCTV table created (stub)' });
}

export async function DELETE(request: Request) {
  // TODO: Implement DynamoDB table deletion logic
  return NextResponse.json({ success: true, message: 'CCTV table deleted (stub)' });
} 