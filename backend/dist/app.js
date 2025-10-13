"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const lead_routes_1 = __importDefault(require("./routes/lead.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const analytics_detailed_routes_1 = __importDefault(require("./routes/analytics-detailed.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const image_routes_1 = __importDefault(require("./routes/image.routes"));
const email_test_routes_1 = __importDefault(require("./routes/email-test.routes"));
const queue_monitor_routes_1 = __importDefault(require("./routes/queue-monitor.routes"));
const email_queue_routes_1 = __importDefault(require("./routes/email-queue.routes"));
const error_handler_1 = require("./middleware/error-handler");
const logger_1 = require("./middleware/logger");
const app = (0, express_1.default)();
// Middleware - CORS configuration
const allowedOrigins = [
    'https://gratis-tattoo.vercel.app',
    'http://localhost:4200',
    'http://localhost:3000',
    process.env.CORS_ORIGIN
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // Allow all origins for now (remove in strict production)
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}));
// Body parser with increased limits for image uploads (after compression: max 2MB per file, 5 files = 10MB)
app.use(express_1.default.json({ limit: '15mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '15mb' }));
app.use(logger_1.logger);
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// API Routes
const apiPrefix = process.env.API_PREFIX || '/api';
app.use(`${apiPrefix}/auth`, auth_routes_1.default);
app.use(`${apiPrefix}/leads`, lead_routes_1.default);
app.use(`${apiPrefix}/upload`, upload_routes_1.default);
app.use(`${apiPrefix}/analytics`, analytics_routes_1.default);
app.use(`${apiPrefix}/analytics-detailed`, analytics_detailed_routes_1.default);
app.use(`${apiPrefix}/images`, image_routes_1.default); // Blob endpoint for images
app.use(`${apiPrefix}/email-test`, email_test_routes_1.default); // Email testing endpoints
app.use(`${apiPrefix}/queue`, queue_monitor_routes_1.default); // Queue monitoring endpoints
app.use(`${apiPrefix}/email-queue`, email_queue_routes_1.default); // Email queue management endpoints
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Rico Tattoo Artist API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: `${apiPrefix}/auth`,
            leads: `${apiPrefix}/leads`,
            upload: `${apiPrefix}/upload`,
            analytics: `${apiPrefix}/analytics`,
            images: `${apiPrefix}/images`,
            emailTest: `${apiPrefix}/email-test`,
            queue: `${apiPrefix}/queue`,
        },
    });
});
// Error handling middleware (must be last)
app.use(error_handler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map