"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
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
        const user = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        console.log('✅ Token verified successfully for user:', user.username);
        req.user = user;
        next();
    }
    catch (error) {
        console.log('❌ Token verification failed:', error.message);
        return res.status(403).json({
            success: false,
            error: 'Ungültiges Token'
        });
    }
};
exports.authenticateToken = authenticateToken;
// Force restart
//# sourceMappingURL=auth.js.map