import { Router } from 'express';
import { analyticsDetailedController } from '../controllers/analytics-detailed.controller';

const router = Router();

// Analytics Dashboard Endpoints
router.get('/funnel-stats', analyticsDetailedController.getFunnelStats.bind(analyticsDetailedController));
router.get('/daily', analyticsDetailedController.getDailyAnalytics.bind(analyticsDetailedController));
router.get('/traffic-sources', analyticsDetailedController.getTrafficSources.bind(analyticsDetailedController));
router.get('/device-stats', analyticsDetailedController.getDeviceStats.bind(analyticsDetailedController));
router.get('/drop-off', analyticsDetailedController.getDropOffAnalysis.bind(analyticsDetailedController));
router.get('/realtime', analyticsDetailedController.getRealTimeStats.bind(analyticsDetailedController));
router.get('/sessions/:sessionId', analyticsDetailedController.getSessionDetails.bind(analyticsDetailedController));

// Event Tracking Endpoints (used by frontend)
router.post('/track-event', analyticsDetailedController.trackEvent.bind(analyticsDetailedController));
router.post('/create-session', analyticsDetailedController.createSession.bind(analyticsDetailedController));

export default router;
