// BookInk Backend API v1.0.1 - Fixed auth table names
import dotenv from 'dotenv';
import app from './app';
import { pool } from './config/database';
import { initializeDatabase } from './utils/init-database';
import { initializeAdminUser } from './utils/init-admin';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, async () => {
  console.log('');
  console.log('🎨 ==========================================');
  console.log('   Rico Tattoo Artist - Backend API');
  console.log('🎨 ==========================================');
  console.log('');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API prefix: ${process.env.API_PREFIX || '/api'}`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:4200'}`);
  console.log('');

  // Test database connection and auto-initialize
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection verified');

    // Auto-create database tables if they don't exist
    await initializeDatabase();

    // Auto-create default admin user if not exists
    await initializeAdminUser();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('');
    console.log('💡 Make sure PostgreSQL is running and .env is configured');
  }

  console.log('');
  console.log('📍 Available endpoints:');
  console.log(`   GET  /health`);
  console.log(`   POST ${process.env.API_PREFIX || '/api'}/auth/login`);
  console.log(`   POST ${process.env.API_PREFIX || '/api'}/auth/create-admin`);
  console.log(`   POST ${process.env.API_PREFIX || '/api'}/leads`);
  console.log(`   GET  ${process.env.API_PREFIX || '/api'}/leads (protected)`);
  console.log(`   GET  ${process.env.API_PREFIX || '/api'}/leads/:id (protected)`);
  console.log(`   PATCH ${process.env.API_PREFIX || '/api'}/leads/:id/status (protected)`);
  console.log(`   GET  ${process.env.API_PREFIX || '/api'}/analytics/stats`);
  console.log(`   POST ${process.env.API_PREFIX || '/api'}/upload`);
  console.log(`   GET  ${process.env.API_PREFIX || '/api'}/images/:filename (blob endpoint)`);
  console.log('');
  console.log('🔐 CRM Dashboard: http://localhost:4200/admin/login');
  console.log('');
  console.log('==========================================');
  console.log('');
});

export default app;
