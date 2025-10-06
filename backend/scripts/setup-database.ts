import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupDatabase() {
  // Connect to postgres database first to create our database if needed
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres' // Connect to default postgres db
  });

  try {
    console.log('🔍 Checking if database exists...');

    // Check if database exists
    const dbCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_DATABASE || 'bizkit_db']
    );

    if (dbCheck.rows.length === 0) {
      console.log('📦 Creating database...');
      await adminPool.query(`CREATE DATABASE ${process.env.DB_DATABASE || 'bizkit_db'}`);
      console.log('✅ Database created!');
    } else {
      console.log('✅ Database already exists');
    }
  } catch (error: any) {
    console.error('❌ Error checking/creating database:', error.message);
  } finally {
    await adminPool.end();
  }

  // Now connect to our database and run schema
  const pool = new Pool({
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

  } catch (error: any) {
    console.error('\n❌ Error setting up schema:', error.message);
    throw error;
  } finally {
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
