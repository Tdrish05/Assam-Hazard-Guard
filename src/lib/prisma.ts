import 'dotenv/config'; // Ensure environment variables are loaded in Prisma v7
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Prevent multiple instances of PrismaClient in development due to hot reloading
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const initPrisma = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Error: DATABASE_URL environment variable is not defined.");
    throw new Error('DATABASE_URL is not set in the environment variables.');
  }

  // Create a PostgreSQL connection pool using the native pg driver
  const pool = new Pool({
    connectionString,
    max: 10, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection fails
  });

  // Instantiate the Prisma adapter for PostgreSQL
  const adapter = new PrismaPg(pool);

  // Return the PrismaClient configured to use the PostgreSQL adapter
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
};

export const prisma = globalForPrisma.prisma ?? initPrisma();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
