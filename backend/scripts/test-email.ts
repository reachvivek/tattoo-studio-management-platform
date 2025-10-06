import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('🧪 Testing Gmail SMTP configuration...\n');

  console.log('Config:');
  console.log('  Host: smtp.gmail.com');
  console.log('  Port: 587');
  console.log('  User:', process.env.EMAIL_USER);
  console.log('  Pass:', process.env.EMAIL_PASSWORD?.substring(0, 4) + '****');
  console.log('');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD?.replace(/\s/g, ''),
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'rogerthatvivek@gmail.com',
      subject: 'BookInk Test Email - SMTP Configuration Working',
      html: `
        <h2>✅ Email Service Working!</h2>
        <p>Your BookInk backend email service is configured correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Email send failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  }
}

testEmail();
