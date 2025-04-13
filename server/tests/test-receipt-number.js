/**
 * Test script for receipt number generation
 * This tests database-based receipt number generation
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure neon for WebSocket connections
neonConfig.webSocketConstructor = ws;

// Create database pool
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 20
});

// Simplified test implementation of getNextReceiptNumber
async function getNextReceiptNumber(pool) {
  // Try to get the current sequence record
  const { rows } = await pool.query("SELECT * FROM receipt_number_sequence LIMIT 1");
  const sequence = rows[0];
  
  if (sequence) {
    // Get current values
    const nextValue = sequence.next_value;
    const prefix = sequence.prefix || 'RC-';
    
    // Update the sequence to the next value
    await pool.query(
      "UPDATE receipt_number_sequence SET next_value = $1, last_updated = NOW() WHERE id = $2",
      [nextValue + 1, sequence.id]
    );
    
    // Format the receipt number with padded zeros
    return `${prefix}${nextValue.toString().padStart(3, '0')}`;
  } else {
    throw new Error("No receipt number sequence found in database");
  }
}

async function testReceiptNumbers() {
  console.log("Testing receipt number generation...");
  
  try {
    // Get current DB sequence
    const initialResult = await pool.query("SELECT * FROM receipt_number_sequence ORDER BY id LIMIT 1");
    const initialSeq = initialResult.rows[0];
    console.log(`Initial DB sequence: prefix="${initialSeq.prefix}", next_value=${initialSeq.next_value}`);
    
    // Generate several receipt numbers to check sequence
    console.log("\n--- Testing Database receipt number generation ---");
    for (let i = 0; i < 3; i++) {
      const receiptNumber = await getNextReceiptNumber(pool);
      console.log(`Generated receipt number: ${receiptNumber}`);
    }
    
    // Test direct database query for comparison
    console.log("\n--- Testing Direct Database Query ---");
    
    // Get current sequence value
    let seqResult = await pool.query("SELECT * FROM receipt_number_sequence ORDER BY id LIMIT 1");
    const currentSeq = seqResult.rows[0];
    console.log(`Current DB sequence: prefix="${currentSeq.prefix}", next_value=${currentSeq.next_value}`);
    
    // Update sequence and get new value
    for (let i = 0; i < 3; i++) {
      // Get current value
      let loopResult = await pool.query("SELECT * FROM receipt_number_sequence ORDER BY id LIMIT 1");
      const seq = loopResult.rows[0];
      const nextValue = seq.next_value;
      const prefix = seq.prefix || 'RC-';
      
      // Update to next value
      await pool.query(
        "UPDATE receipt_number_sequence SET next_value = $1, last_updated = NOW() WHERE id = $2",
        [nextValue + 1, seq.id]
      );
      
      // Format receipt number
      const receiptNumber = `${prefix}${nextValue.toString().padStart(3, '0')}`;
      console.log(`Direct DB query generated receipt number: ${receiptNumber}`);
    }
    
    console.log("\nTests completed successfully!");
  } catch (error) {
    console.error("Error in tests:", error);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the tests
testReceiptNumbers();