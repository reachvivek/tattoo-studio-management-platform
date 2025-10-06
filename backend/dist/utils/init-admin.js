"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAdminUser = initializeAdminUser;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../config/database");
async function initializeAdminUser() {
    try {
        console.log('\n🔧 ========================================');
        console.log('   Checking Admin User Initialization');
        console.log('========================================');
        // Check if admin user exists
        const checkQuery = 'SELECT * FROM users WHERE username = $1 OR email = $2';
        const result = await database_1.pool.query(checkQuery, ['admin', 'bookinktermine@gmail.com']);
        if (result.rows.length > 0) {
            console.log('✅ Admin user already exists');
            console.log('   Username: admin');
            console.log('   Email: bookinktermine@gmail.com');
            console.log('========================================\n');
            return;
        }
        console.log('⚙️  Admin user not found. Creating default admin...');
        // Create default admin user
        const username = 'admin';
        const email = 'bookinktermine@gmail.com';
        const password = 'Tattoopasswort123!';
        const role = 'admin';
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const insertQuery = `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at
    `;
        const insertResult = await database_1.pool.query(insertQuery, [
            username,
            email,
            hashedPassword,
            role
        ]);
        const user = insertResult.rows[0];
        console.log('✅ Admin user created successfully!');
        console.log('========================================');
        console.log('   Username: admin');
        console.log('   Email: bookinktermine@gmail.com');
        console.log('   Password: Tattoopasswort123!');
        console.log('   Role: admin');
        console.log('   Created: ' + new Date(user.created_at).toLocaleString());
        console.log('========================================');
        console.log('⚠️  IMPORTANT: Change the default password after first login!');
        console.log('========================================\n');
    }
    catch (error) {
        console.error('\n❌ Error initializing admin user:');
        console.error('Error:', error.message);
        // Don't crash the app if admin creation fails
        if (error.code === '42P01') {
            console.error('⚠️  Users table does not exist yet. Run database setup first.');
        }
        else if (error.code === '23505') {
            console.log('ℹ️  Admin user already exists (duplicate key)');
        }
        else {
            console.error('Full error:', error);
        }
        console.log('========================================\n');
    }
}
//# sourceMappingURL=init-admin.js.map