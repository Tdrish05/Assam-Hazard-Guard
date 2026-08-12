const dotenv = require('dotenv');
dotenv.config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  console.log('Testing connection with DATABASE_URL:', process.env.DATABASE_URL ? 'URL is set' : 'URL is NOT set');
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000 
  });
  
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    console.log('Connecting to database and querying alerts table with status filter...');
    const alerts = await prisma.alert.findMany({
      where: { status: 'ACTIVE' }
    });
    console.log('SUCCESS! Queried database. Found alerts count:', alerts.length);
  } catch (err) {
    console.error('DATABASE ERROR:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
