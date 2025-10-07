// Quick script to manually trigger email processor
require('dotenv').config();
const { emailProcessorService } = require('./dist/services/email-processor.service');

console.log('🚀 Manually triggering email queue processor...');
emailProcessorService.processQueue()
  .then(() => {
    console.log('✅ Email processing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
