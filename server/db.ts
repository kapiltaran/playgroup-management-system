import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with connection timeout and better error handling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000, // 5 seconds timeout
  max: 20, // Maximum number of clients in the pool
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// Configure drizzle with the pool and schema
export const db = drizzle({ client: pool, schema });

// Function to initialize the database
export async function initDatabase() {
  try {
    // Check if receipt_number_sequence table is initialized
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'receipt_number_sequence')"
    );
    
    const tableExists = rows[0]?.exists;
    
    if (tableExists) {
      // Check if we have a sequence record
      const result = await pool.query("SELECT COUNT(*) FROM receipt_number_sequence");
      const count = parseInt(result.rows[0]?.count || '0');
      
      if (count === 0) {
        // Create initial sequence record if none exists
        await pool.query(
          "INSERT INTO receipt_number_sequence (next_value, prefix) VALUES (1, 'RC-')"
        );
        console.log("✅ Initialized receipt number sequence");
      }
    }
    
    console.log("✅ Database connection established");
    return true;
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    return false;
  }
}
