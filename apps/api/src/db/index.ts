import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from '../config';

// SSL configuration for Neon and other cloud databases
const sslConfig = config.database.ssl || config.database.url.includes('sslmode=require') 
  ? { rejectUnauthorized: false } 
  : false;

// Create database clients
const migrationClient = postgres(config.database.url, { 
  max: 1,
  ssl: sslConfig,
});
const queryClient = postgres(config.database.url, {
  ssl: sslConfig,
});

// Initialize Drizzle with schema
export const db = drizzle(queryClient, { schema });

// Export migration client for Drizzle Kit
export { migrationClient };

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    await queryClient`SELECT 1 as test`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

/**
 * Close database connections gracefully
 */
export const closeConnections = async (): Promise<void> => {
  try {
    await queryClient.end();
    await migrationClient.end();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};

// Export all schema tables and relations
export * from './schema';