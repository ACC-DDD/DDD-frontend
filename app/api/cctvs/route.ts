import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    const command = new ScanCommand({
      TableName: 'cctv_locations',
      ...(address && {
        FilterExpression: 'contains(address, :address)',
        ExpressionAttributeValues: {
          ':address': { S: address }
        }
      })
    });

    const { Items } = await client.send(command);
    
    if (!Items) {
      return NextResponse.json([]);
    }

    const cctvs = Items.map(item => {
      const unmarshalled = unmarshall(item);
      return {
        id: unmarshalled.id,
        name: unmarshalled.name,
        address: unmarshalled.address,
        lat: unmarshalled.lat,
        lng: unmarshalled.lng,
        cctvUrl: unmarshalled.cctvUrl,
        city: unmarshalled.city,
        district: unmarshalled.district,
        status: unmarshalled.status || true
      };
    });

    return NextResponse.json(cctvs);
  } catch (error) {
    console.error('Error fetching CCTV data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CCTV data' },
      { status: 500 }
    );
  }
} 

export async function POST(request: Request) {
  // TODO: Implement create/overwrite CCTV logic
  return NextResponse.json({ success: true, message: 'CCTV created/overwritten (stub)' });
} 