import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error('POSTGRES_URL environment variable is not set for DB client');
}

/**
 * Postgres client for queries
 */
const queryClient = postgres(databaseUrl);

/**
 * Main database instance with Drizzle ORM
 */
export const db = drizzle(queryClient, { schema });

/**
 * Test the database connection
 * @returns Promise that resolves to true if connection succeeds, or the error if it fails
 */
export async function TestDatabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Try a simple query to test the connection
    // Ensure databaseUrl is not undefined before using it
    if (!databaseUrl) {
      return { 
        success: false, 
        message: 'Database URL is not defined' 
      };
    }
    
    const testClient = postgres(databaseUrl, { max: 1 });
    
    // Use the correct method for postgres client
    await testClient`SELECT 1 as connection_test`;
    await testClient.end();
    
    return { 
      success: true, 
      message: 'Database connection successful' 
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: `Database connection failed: ${error.message || 'Unknown error'}` 
    };
  }
}

// Export the schema for easy access
export * from './schema'; 