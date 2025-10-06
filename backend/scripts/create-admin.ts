import bcrypt from 'bcrypt';
import { pool } from '../config/database';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  console.log('\n🎨 Rico Tattoo CRM - Admin User erstellen\n');

  try {
    const username = await question('Benutzername: ');
    const email = await question('E-Mail: ');
    const password = await question('Passwort: ');

    if (!username || !email || !password) {
      console.error('❌ Alle Felder sind erforderlich!');
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert admin user
    const result = await pool.query(
      `INSERT INTO admin_users (username, password_hash, email, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, username, email, role, created_at`,
      [username, passwordHash, email]
    );

    const admin = result.rows[0];

    console.log('\n✅ Admin-Benutzer erfolgreich erstellt!\n');
    console.log('ID:', admin.id);
    console.log('Benutzername:', admin.username);
    console.log('E-Mail:', admin.email);
    console.log('Rolle:', admin.role);
    console.log('Erstellt am:', admin.created_at);
    console.log('\n');
  } catch (error: any) {
    if (error.code === '23505') {
      console.error('\n❌ Fehler: Benutzername bereits vergeben!\n');
    } else {
      console.error('\n❌ Fehler:', error.message);
    }
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();
