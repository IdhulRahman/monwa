const { MongoClient } = require('mongodb');
const path = require('path');

// Load environment from root .env (single global config)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let client = null;
let db = null;

/**
 * Get MongoDB connection
 */
async function getDb() {
    if (db) return db;
    
    // Support both MONGO_URI (new) and MONGO_URL (legacy) for compatibility
    const mongoUrl = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017';
    const dbName = process.env.DB_NAME || 'whatsapp_monitor';
    
    console.log(`[DB] Connecting to MongoDB: ${mongoUrl}/${dbName}`);
    
    client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db(dbName);
    
    console.log('[DB] Connected to MongoDB');
    return db;
}

/**
 * Close MongoDB connection
 */
async function closeDb() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('[DB] MongoDB connection closed');
    }
}

module.exports = { getDb, closeDb };
