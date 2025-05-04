import { NextResponse } from 'next/server';
import { TestDatabaseConnection } from '@/db/connection';

export async function GET() {
  try {
    const connectionResult = await TestDatabaseConnection();
    
    if (connectionResult.success) {
      return NextResponse.json({
        status: 'success',
        message: connectionResult.message
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: connectionResult.message
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: `Error testing database connection: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
} 