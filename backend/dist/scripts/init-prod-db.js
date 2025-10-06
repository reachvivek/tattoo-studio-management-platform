"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prodPool = new pg_1.Pool({
    host: 'dpg-d3hsrgbuibrs73b6jh3g-a.oregon-postgres.render.com',
    port: 5432,
    user: 'bookink_user',
    password: 'w964vYSq6wSP0F386YjtUcfFVeAxiM6O',
    database: 'bookink_db',
    ssl: { rejectUnauthorized: false }
});
async function initProdDatabase() {
    try {
        console.log('\n🔧 Connecting to production database...');
        await prodPool.query('SELECT NOW()');
        console.log('✅ Connected to production database');
        // Check existing tables
        const checkTablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'leads', 'activities', 'admin_users')
    `;
        const existingTables = await prodPool.query(checkTablesQuery);
        const tableNames = existingTables.rows.map((row) => row.table_name);
        console.log('\n📊 Existing tables:', tableNames);
        // Drop old admin_users table if exists
        if (tableNames.includes('admin_users')) {
            console.log('\n🗑️  Dropping old admin_users table...');
            await prodPool.query('DROP TABLE IF EXISTS admin_users CASCADE');
            console.log('✅ Dropped admin_users table');
        }
        // Create users table if not exists
        if (!tableNames.includes('users')) {
            console.log('\n📝 Creating users table...');
            await prodPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'admin',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            console.log('✅ Users table created');
        }
        else {
            console.log('✅ Users table already exists');
        }
        // Create admin user
        console.log('\n👤 Creating admin user...');
        const checkUser = await prodPool.query('SELECT * FROM users WHERE username = $1 OR email = $2', ['admin', 'bookinktermine@gmail.com']);
        if (checkUser.rows.length > 0) {
            console.log('ℹ️  Admin user already exists, updating password...');
            const hashedPassword = await bcrypt_1.default.hash('Tattoopasswort123!', 10);
            await prodPool.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, 'admin']);
            console.log('✅ Admin password updated');
        }
        else {
            const hashedPassword = await bcrypt_1.default.hash('Tattoopasswort123!', 10);
            await prodPool.query(`
        INSERT INTO users (username, email, password, role)
        VALUES ($1, $2, $3, $4)
      `, ['admin', 'bookinktermine@gmail.com', hashedPassword, 'admin']);
            console.log('✅ Admin user created');
        }
        console.log('\n✅ Production database initialization completed!');
        console.log('   Username: admin');
        console.log('   Email: bookinktermine@gmail.com');
        console.log('   Password: Tattoopasswort123!');
        await prodPool.end();
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Error:', error);
        await prodPool.end();
        process.exit(1);
    }
}
initProdDatabase();
//# sourceMappingURL=init-prod-db.js.map