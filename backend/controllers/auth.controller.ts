import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Benutzername und Passwort erforderlich'
        });
      }

      // Get admin user
      const result = await pool.query(
        'SELECT * FROM admin_users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Ungültige Anmeldedaten'
        });
      }

      const admin = result.rows[0];

      // Check password
      const isValid = await bcrypt.compare(password, admin.password_hash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Ungültige Anmeldedaten'
        });
      }

      // Generate JWT
      const token = jwt.sign(
        {
          id: admin.id,
          username: admin.username,
          role: admin.role
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '24h' }
      );

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
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler bei der Anmeldung'
      });
    }
  }

  async createAdmin(req: Request, res: Response) {
    try {
      const { username, password, email } = req.body;

      if (!username || !password || !email) {
        return res.status(400).json({
          success: false,
          error: 'Alle Felder sind erforderlich'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create admin
      const result = await pool.query(
        `INSERT INTO admin_users (username, password_hash, email, role)
         VALUES ($1, $2, $3, 'admin')
         RETURNING id, username, email, role, created_at`,
        [username, passwordHash, email]
      );

      res.status(201).json({
        success: true,
        message: 'Admin-Benutzer erstellt',
        data: result.rows[0]
      });
    } catch (error: any) {
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

  async verify(req: Request, res: Response) {
    res.json({
      success: true,
      data: req.body.user
    });
  }
}

export const authController = new AuthController();
