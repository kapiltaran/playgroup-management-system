/**
 * Database migration script to initialize receipt_number_sequence table
 * This script is run manually when needed
 */

// Use ES Module imports
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure neon for WebSocket connections
neonConfig.webSocketConstructor = ws;

// Create pool
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 20
});

async function createReceiptSequenceTable() {
  try {
    console.log('Checking if receipt_number_sequence table exists...');
    
    // Check if table exists
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'receipt_number_sequence')"
    );
    
    const tableExists = rows[0]?.exists;
    
    if (!tableExists) {
      console.log('Creating receipt_number_sequence table...');
      
      // Create table using SQL
      await pool.query(`
        CREATE TABLE receipt_number_sequence (
          id SERIAL PRIMARY KEY,
          next_value INTEGER NOT NULL DEFAULT 1, 
          prefix TEXT NOT NULL DEFAULT 'RC-',
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('Table created successfully');
      
      // Insert initial sequence
      await pool.query(`
        INSERT INTO receipt_number_sequence (next_value, prefix)
        VALUES (1, 'RC-');
      `);
      
      console.log('Initial sequence created with next_value=1 and prefix="RC-"');
    } else {
      console.log('Table receipt_number_sequence already exists');
      
      // Check if we have at least one sequence record
      const result = await pool.query("SELECT COUNT(*) FROM receipt_number_sequence");
      const count = parseInt(result.rows[0]?.count || '0');
      
      if (count === 0) {
        // Create initial sequence record if none exists
        await pool.query(
          "INSERT INTO receipt_number_sequence (next_value, prefix) VALUES (1, 'RC-')"
        );
        console.log("Created initial receipt number sequence record");
      } else {
        console.log(`Found ${count} existing receipt number sequence records`);
      }
    }
    
    // Show current sequence value
    const seqResult = await pool.query("SELECT * FROM receipt_number_sequence ORDER BY id LIMIT 1");
    if (seqResult.rows.length > 0) {
      const seq = seqResult.rows[0];
      console.log(`Current sequence: prefix="${seq.prefix}", next_value=${seq.next_value}`);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close connection
    await pool.end();
  }
}

// Run the migration
createReceiptSequenceTable();