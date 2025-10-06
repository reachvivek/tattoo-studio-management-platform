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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../config/database");
const readline = __importStar(require("readline"));
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function question(query) {
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
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Insert admin user
        const result = await database_1.pool.query(`INSERT INTO admin_users (username, password_hash, email, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, username, email, role, created_at`, [username, passwordHash, email]);
        const admin = result.rows[0];
        console.log('\n✅ Admin-Benutzer erfolgreich erstellt!\n');
        console.log('ID:', admin.id);
        console.log('Benutzername:', admin.username);
        console.log('E-Mail:', admin.email);
        console.log('Rolle:', admin.role);
        console.log('Erstellt am:', admin.created_at);
        console.log('\n');
    }
    catch (error) {
        if (error.code === '23505') {
            console.error('\n❌ Fehler: Benutzername bereits vergeben!\n');
        }
        else {
            console.error('\n❌ Fehler:', error.message);
        }
    }
    finally {
        rl.close();
        await database_1.pool.end();
    }
}
createAdmin();
//# sourceMappingURL=create-admin.js.map