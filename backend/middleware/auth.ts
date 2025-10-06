import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 Auth Middleware - Headers:', req.headers['authorization'] ? 'Present' : 'Missing');
  console.log('🔐 Auth Middleware - Token extracted:', token ? 'Yes' : 'No');

  if (!token) {
    console.log('❌ Auth failed: No token provided');
    return res.status(401).json({
      success: false,
      error: 'Zugriff verweigert'
    });
  }

  try {
    const user = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );
    console.log('✅ Token verified successfully for user:', (user as any).username);
    (req as any).user = user;
    next();
  } catch (error: any) {
    console.log('❌ Token verification failed:', error.message);
    return res.status(403).json({
      success: false,
      error: 'Ungültiges Token'
    });
  }
};
// Force restart
