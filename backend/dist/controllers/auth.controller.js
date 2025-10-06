"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
class AuthController {
    async login(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Benutzername und Passwort erforderlich'
                });
            }
            // Get admin user
            const result = await database_1.pool.query('SELECT * FROM users WHERE username = $1', [username]);
            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Ungültige Anmeldedaten'
                });
            }
            const admin = result.rows[0];
            // Check password
            const isValid = await bcrypt_1.default.compare(password, admin.password);
            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Ungültige Anmeldedaten'
                });
            }
            // Generate JWT (48 hours expiration)
            const token = jsonwebtoken_1.default.sign({
                id: admin.id,
                username: admin.username,
                role: admin.role
            }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', { expiresIn: '48h' });
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: admin.id,
                        username: admin.username,
                        email: admin.email,
                        role: admin.role
                    }
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler bei der Anmeldung'
            });
        }
    }
    async createAdmin(req, res) {
        try {
            const { username, password, email } = req.body;
            if (!username || !password || !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Alle Felder sind erforderlich'
                });
            }
            // Hash password
            const passwordHash = await bcrypt_1.default.hash(password, 10);
            // Create admin
            const result = await database_1.pool.query(`INSERT INTO admin_users (username, password_hash, email, role)
         VALUES ($1, $2, $3, 'admin')
         RETURNING id, username, email, role, created_at`, [username, passwordHash, email]);
            res.status(201).json({
                success: true,
                message: 'Admin-Benutzer erstellt',
                data: result.rows[0]
            });
        }
        catch (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({
                    success: false,
                    error: 'Benutzername bereits vergeben'
                });
            }
            console.error('Create admin error:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Erstellen des Admin-Benutzers'
            });
        }
    }
    async verify(req, res) {
        res.json({
            success: true,
            data: req.body.user
        });
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map