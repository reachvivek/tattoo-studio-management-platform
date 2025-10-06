"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
async function setupDatabase() {
    // Connect to postgres database first to create our database if needed
    const adminPool = new pg_1.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres' // Connect to default postgres db
    });
    try {
        console.log('🔍 Checking if database exists...');
        // Check if database exists
        const dbCheck = await adminPool.query("SELECT 1 FROM pg_database WHERE datname = $1", [process.env.DB_DATABASE || 'bizkit_db']);
        if (dbCheck.rows.length === 0) {
            console.log('📦 Creating database...');
            await adminPool.query(`CREATE DATABASE ${process.env.DB_DATABASE || 'bizkit_db'}`);
            console.log('✅ Database created!');
        }
        else {
            console.log('✅ Database already exists');
        }
    }
    catch (error) {
        console.error('❌ Error checking/creating database:', error.message);
    }
    finally {
        await adminPool.end();
    }
    // Now connect to our database and run schema
    const pool = new pg_1.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'bizkit_db'
    });
    try {
        console.log('\n📋 Reading schema file...');
        const schemaPath = path.join(__dirname, '..', 'schemas', 'database.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        console.log('🔧 Setting up database schema...');
        await pool.query(schema);
        console.log('\n✅ Database setup complete!');
        console.log('\nTables created:');
        const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
        tables.rows.forEach(row => console.log('  -', row.table_name));
    }
    catch (error) {
        console.error('\n❌ Error setting up schema:', error.message);
        throw error;
    }
    finally {
        await pool.end();
    }
}
setupDatabase()
    .then(() => {
    console.log('\n🎉 All done! You can now run: npm run create-admin\n');
    process.exit(0);
})
    .catch(error => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
});
//# sourceMappingURL=setup-database.js.map