import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: Aggregate reactions from comments and Twitter
  
  return NextResponse.json({
    positive: 0,
    negative: 0,
    comments: 0
  });
}
