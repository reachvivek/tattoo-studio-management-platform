import dotenv from 'dotenv';
import app from './app';
import { pool } from './config/database';

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

  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection verified');
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
  console.log('');
  console.log('🔐 CRM Dashboard: http://localhost:4200/admin/login');
  console.log('');
  console.log('==========================================');
  console.log('');
});

export default app;
