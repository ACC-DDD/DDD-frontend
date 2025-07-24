import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // TODO: Implement actual CCTV stream logic
    // For now, return a mock stream URL
    const mockStreamUrl = `https://example.com/cctv/stream/${id}`;
    
    return NextResponse.json({
      streamUrl: mockStreamUrl,
      status: 'active'
    });
  } catch (error) {
    console.error('Error fetching CCTV stream:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CCTV stream' },
      { status: 500 }
    );
  }
} 