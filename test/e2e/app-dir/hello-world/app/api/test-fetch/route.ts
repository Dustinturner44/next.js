import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Make a test fetch request to demonstrate network capture
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    const data = await response.json();
    
    return NextResponse.json({
      message: 'Test fetch completed',
      fetchedData: data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to fetch',
      message: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Make a POST request
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: body.title || 'Test Post',
        body: body.body || 'This is a test post',
        userId: 1
      })
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      message: 'Test POST completed',
      postedData: data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to post',
      message: error.message
    }, { status: 500 });
  }
}