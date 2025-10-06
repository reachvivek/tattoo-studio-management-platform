import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
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
    req.body.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Ungültiges Token'
    });
  }
};
