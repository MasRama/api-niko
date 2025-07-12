import HyperExpress from 'hyper-express';

// Import API Controllers
import AuthApiController from '../app/controllers/api/AuthApiController';
import ProfileApiController from '../app/controllers/api/ProfileApiController';
import InfrastructureApiController from '../app/controllers/api/InfrastructureApiController';
import BookingApiController from '../app/controllers/api/BookingApiController';
import EventApiController from '../app/controllers/api/EventApiController';
import FeedbackApiController from '../app/controllers/api/FeedbackApiController';
import KategoriApiController from '../app/controllers/api/KategoriApiController';

// Import JWT Middlewares
import { jwtAuth as jwtRequired, optionalJwtAuth as jwtOptional, refreshableJwtAuth as jwtRefreshable } from '../app/middlewares/jwtAuth';

// Import Rate Limiting
import { apiRateLimiter, authRateLimiter, uploadRateLimiter } from '../app/middlewares/rate_limiter';

// Import Request Logger
import { requestLogger } from '../app/middlewares/requestLogger';

const ApiRoute = new HyperExpress.Router();

/**
 * API v1 Routes
 * All API routes are prefixed with /api/v1/
 * ================================================
 */

// Apply general rate limiting to all API routes
ApiRoute.use(apiRateLimiter.middleware);

// Apply request logging to all API routes for debugging
ApiRoute.use(requestLogger);

/**
 * Health Check & System Routes
 * ------------------------------------------------
 * GET /api/v1/health - API health check
 * GET /api/v1/endpoints - List all available endpoints
 */
ApiRoute.get('/health', (req, res) => {
    res.json({
        statusCode: 200,
        message: 'MCC API is running',
        data: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            status: 'healthy'
        }
    });
});

ApiRoute.get('/endpoints', (req, res) => {
    res.json({
        statusCode: 200,
        message: 'Available API endpoints',
        data: {
            auth: [
                'POST /api/v1/auth/login',
                'POST /api/v1/auth/register-personal',
                'POST /api/v1/auth/register-instansi', 
                'POST /api/v1/auth/verify-account',
                'POST /api/v1/auth/refresh-token',
                'POST /api/v1/auth/save/fcm-token',
                'POST /api/v1/auth/logout'
            ],
            profile: [
                'GET /api/v1/users/profile-user',
                'PATCH /api/v1/users/profile-user',
                'GET /api/v1/users/instansi-profile',
                'PATCH /api/v1/users/instansi-profile',
                'GET /api/v1/users/kategori-instansi',
                'POST /api/v1/auth/reset-password'
            ],
            infrastructure: [
                'GET /api/v1/infrastructure/list',
                'GET /api/v1/infrastructure/:id',
                'GET /api/v1/booking/infra-user',
                'GET /api/v1/infrastructure/facility-overview',
                'GET /api/v1/infrastructure/search-prasarana'
            ],
            booking: [
                'POST /api/v1/booking/booking-ruangan',
                'GET /api/v1/booking/event/user',
                'GET /api/v1/booking/jadwal/:prasarana_id/:tanggal',
                'GET /api/v1/booking/status',
                'GET /api/v1/booking/:booking_id/detail'
            ],
            events: [
                'GET /api/v1/event-mcc',
                'GET /api/v1/event-mcc/detail/:eventId/:date',
                'GET /api/v1/kategori-event',
                'GET /api/v1/ekraf',
                'GET /api/v1/prasarana'
            ],
            feedback: [
                'POST /api/v1/feedback-data-diri/create',
                'POST /api/v1/user-responded/create',
                'POST /api/v1/feedback-usul/create',
                'POST /api/v1/feedback-lainnya/create/:idBooking?',
                'GET /api/v1/responded/pertanyaan/pendapat',
                'DELETE /api/v1/feedback/:id',
                'GET /api/v1/feedback/statistics'
            ]
        }
    });
});

/**
 * Authentication Routes (No JWT Required)
 * ------------------------------------------------
 * POST /auth/login - User login
 * POST /auth/register-personal - Register personal account
 * POST /auth/register-instansi - Register institutional account
 * POST /auth/verify-account - Verify account with OTP
 */
ApiRoute.post('/auth/login', [authRateLimiter.middleware], AuthApiController.login);
ApiRoute.post('/auth/register-personal', [authRateLimiter.middleware, uploadRateLimiter.middleware], AuthApiController.registerPersonal);
ApiRoute.post('/auth/register-instansi', [authRateLimiter.middleware, uploadRateLimiter.middleware], AuthApiController.registerInstansi);
ApiRoute.post('/instansi-user', [authRateLimiter.middleware, uploadRateLimiter.middleware], AuthApiController.registerInstansi);
ApiRoute.post('/auth/verify-account', [authRateLimiter.middleware], AuthApiController.verifyAccount);

/**
 * Token Management Routes (Special JWT Handling)
 * ------------------------------------------------
 * POST /auth/refresh-token - Refresh access token (requires refresh token)
 * POST /auth/logout - Logout user (requires JWT)
 */
ApiRoute.post('/auth/refresh-token', [jwtRefreshable], AuthApiController.refreshToken);
ApiRoute.post('/auth/logout', [jwtRequired()], AuthApiController.logout);

/**
 * Profile Management Routes (JWT Required)
 * ------------------------------------------------
 * GET /users/profile-user - Get user profile
 * PATCH /users/profile-user - Update user profile
 * GET /users/instansi-profile - Get institutional profile
 * PATCH /users/instansi-profile - Update institutional profile
 * GET /users/kategori-instansi - Get institution categories
 * POST /auth/reset-password - Change password
 */
ApiRoute.get('/users/profile-user', [jwtRequired()], ProfileApiController.getProfile);
ApiRoute.patch('/users/profile-user', [jwtRequired()], ProfileApiController.updateProfile);
ApiRoute.get('/users/instansi-profile', [jwtRequired()], ProfileApiController.getInstansiProfile);
ApiRoute.patch('/users/instansi-profile', [jwtRequired()], ProfileApiController.updateInstansiProfile);
ApiRoute.get('/users/kategori-instansi', ProfileApiController.getKategoriInstansi);
ApiRoute.post('/auth/reset-password', [jwtRequired()], ProfileApiController.changePassword);

/**
 * Infrastructure & Facility Routes (Mixed JWT)
 * ------------------------------------------------
 * GET /infrastructure/list - List infrastructure (no JWT)
 * GET /infrastructure/:id - Infrastructure detail (no JWT)
 * GET /booking/infra-user - Infrastructure for booking (JWT required)
 * GET /infrastructure/facility-overview - Facility overview (no JWT)
 * GET /infrastructure/search-prasarana - Search facilities (no JWT)
 */
ApiRoute.get('/infrastructure/list', InfrastructureApiController.getAllInfrastruktur);
ApiRoute.get('/infrastructure/:id', InfrastructureApiController.getInfrastrukturById);
ApiRoute.get('/infrastruktur/sarana-prasarana', InfrastructureApiController.getAllInfrastruktur);
ApiRoute.get('/booking/infra-user', [jwtRequired()], InfrastructureApiController.getBookingInfraList);
ApiRoute.get('/infrastructure/facility-overview', InfrastructureApiController.getFacilityOverview);
ApiRoute.get('/infrastructure/search-prasarana', InfrastructureApiController.searchPrasarana);

/**
 * Booking System Routes (JWT Required)
 * ------------------------------------------------
 * POST /booking/booking-ruangan - Create new booking
 * GET /booking/event/user - Get user bookings
 * GET /booking/jadwal/:prasarana_id/:tanggal - Check availability
 * GET /booking/status - Get booking status
 * GET /booking/:booking_id/detail - Get booking detail
 */
ApiRoute.post('/booking/booking-ruangan', [jwtRequired(), uploadRateLimiter.middleware], BookingApiController.createBooking);
ApiRoute.get('/booking/event/user', [jwtRequired()], BookingApiController.getUserBookings);
ApiRoute.get('/booking/jadwal/:prasarana_id/:tanggal', BookingApiController.getJadwalAvailability);
ApiRoute.get('/booking/show-jadwal/:idPrasarana', (req, res) => {
    // Pemetaan parameter agar kompatibel dengan controller lama
    // idPrasarana -> prasarana_id, query date -> tanggal (default hari ini)
    // @ts-ignore
    req.params.prasarana_id = req.params.idPrasarana;
    // @ts-ignore
    req.params.tanggal = (req.query.date as string) || new Date().toISOString().split('T')[0];
    // @ts-ignore
    return BookingApiController.getJadwalAvailability(req, res);
});
ApiRoute.get('/booking/status', [jwtRequired()], BookingApiController.getBookingStatus);
ApiRoute.get('/booking/:booking_id/detail', [jwtRequired()], BookingApiController.getBookingDetail);

/**
 * Event Management Routes (Mixed JWT)
 * ------------------------------------------------
 * GET /event-mcc - List events (no JWT)
 * GET /event-mcc/detail/:eventId/:date - Event detail (no JWT)
 * GET /kategori-event - Event categories (no JWT)
 * GET /ekraf - EKRAF categories (no JWT)
 * GET /prasarana - List rooms for filtering (no JWT)
 */
ApiRoute.get('/event-mcc', EventApiController.getAllEvents);
ApiRoute.get('/event-mcc/detail/:eventId/:date', EventApiController.getEventDetail);
ApiRoute.get('/kategori-event', EventApiController.getKategoriEvent);
ApiRoute.get('/ekraf', EventApiController.getEkrafCategories);
ApiRoute.get('/prasarana', EventApiController.getPrasaranaList);

/**
 * Feedback System Routes (Mixed JWT)
 * ------------------------------------------------
 * POST /feedback-data-diri/create - Create feedback data (optional JWT)
 * POST /user-responded/create - Submit ratings (optional JWT)
 * POST /feedback-usul/create - Submit suggestions (optional JWT)
 * POST /feedback-lainnya/create/:idBooking? - Submit room feedback (optional JWT)
 * GET /responded/pertanyaan/pendapat - Get feedback questions (no JWT)
 * DELETE /feedback/:id - Delete feedback (JWT required)
 * GET /feedback/statistics - Get feedback statistics (JWT required)
 */
ApiRoute.post('/feedback-data-diri/create', [jwtOptional], FeedbackApiController.createFeedbackDataDiri);
ApiRoute.post('/user-responded/create', [jwtOptional], FeedbackApiController.submitOpinionRating);
ApiRoute.post('/feedback-usul/create', [jwtOptional], FeedbackApiController.submitSuggestionFeedback);
ApiRoute.post('/feedback-lainnya/create/:idBooking?', [jwtOptional], FeedbackApiController.submitRoomFeedback);
ApiRoute.get('/responded/pertanyaan/pendapat', FeedbackApiController.getOpinionQuestions);
ApiRoute.delete('/feedback/:id', [jwtRequired()], FeedbackApiController.deleteFeedback);
ApiRoute.get('/feedback/statistics', [jwtRequired()], FeedbackApiController.getFeedbackStatistics);

/**
 * Kategori Routes (No JWT)
 * ------------------------------------------------
 * GET /kategori - Get all categories
 */
ApiRoute.get('/kategori', KategoriApiController.getKategori);

/**
 * 404 Handler for API Routes
 * ------------------------------------------------
 * Handles requests to non-existent API endpoints
 * This middleware will log 404 errors for debugging
 */
ApiRoute.use('*', (req, res) => {
    // Log 404 untuk debugging
    const apiLog = {
        timestamp: new Date().toISOString(),
        request: {
            url: req.url,
            method: req.method,
            headers: req.headers,
            body: req.body || null
        },
        response: {
            statusCode: 404,
            message: 'API endpoint not found'
        },
        duration: '0ms'
    };
    
    console.log('📋 API Log (404):', JSON.stringify(apiLog, null, 2));
    
    res.status(404).json({
        statusCode: 404,
        message: 'API endpoint not found',
        error: 'Not Found',
        path: req.url
    });
});

export default ApiRoute;