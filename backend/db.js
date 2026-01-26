const { MongoClient } = require('mongodb');
require('dotenv').config();

let client = null;
let db = null;

/**
 * Get MongoDB connection
 */
async function getDb() {
    if (db) return db;
    
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
    const dbName = process.env.DB_NAME || 'test_database';
    
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
