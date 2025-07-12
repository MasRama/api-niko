"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hyper_express_1 = __importDefault(require("hyper-express"));
const AuthApiController_1 = __importDefault(require("../app/controllers/api/AuthApiController"));
const ProfileApiController_1 = __importDefault(require("../app/controllers/api/ProfileApiController"));
const InfrastructureApiController_1 = __importDefault(require("../app/controllers/api/InfrastructureApiController"));
const BookingApiController_1 = __importDefault(require("../app/controllers/api/BookingApiController"));
const EventApiController_1 = __importDefault(require("../app/controllers/api/EventApiController"));
const FeedbackApiController_1 = __importDefault(require("../app/controllers/api/FeedbackApiController"));
const KategoriApiController_1 = __importDefault(require("../app/controllers/api/KategoriApiController"));
const jwtAuth_1 = require("../app/middlewares/jwtAuth");
const rate_limiter_1 = require("../app/middlewares/rate_limiter");
const requestLogger_1 = __importDefault(require("../app/middlewares/requestLogger"));
const ApiRoute = new hyper_express_1.default.Router();
ApiRoute.use(rate_limiter_1.apiRateLimiter.middleware);
ApiRoute.use(requestLogger_1.default);
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
ApiRoute.post('/auth/login', [rate_limiter_1.authRateLimiter.middleware], AuthApiController_1.default.login);
ApiRoute.post('/auth/register-personal', [rate_limiter_1.authRateLimiter.middleware, rate_limiter_1.uploadRateLimiter.middleware], AuthApiController_1.default.registerPersonal);
ApiRoute.post('/auth/register-instansi', [rate_limiter_1.authRateLimiter.middleware, rate_limiter_1.uploadRateLimiter.middleware], AuthApiController_1.default.registerInstansi);
ApiRoute.post('/instansi-user', [rate_limiter_1.authRateLimiter.middleware, rate_limiter_1.uploadRateLimiter.middleware], AuthApiController_1.default.registerInstansi);
ApiRoute.post('/auth/verify-account', [rate_limiter_1.authRateLimiter.middleware], AuthApiController_1.default.verifyAccount);
ApiRoute.post('/auth/refresh-token', [jwtAuth_1.refreshableJwtAuth], AuthApiController_1.default.refreshToken);
ApiRoute.post('/auth/save/fcm-token', [jwtAuth_1.optionalJwtAuth], AuthApiController_1.default.saveFcmToken);
ApiRoute.post('/auth/logout', [(0, jwtAuth_1.jwtAuth)()], AuthApiController_1.default.logout);
ApiRoute.get('/users/profile-user', [(0, jwtAuth_1.jwtAuth)()], ProfileApiController_1.default.getProfile);
ApiRoute.patch('/users/profile-user', [(0, jwtAuth_1.jwtAuth)()], ProfileApiController_1.default.updateProfile);
ApiRoute.get('/users/instansi-profile', [(0, jwtAuth_1.jwtAuth)()], ProfileApiController_1.default.getInstansiProfile);
ApiRoute.patch('/users/instansi-profile', [(0, jwtAuth_1.jwtAuth)()], ProfileApiController_1.default.updateInstansiProfile);
ApiRoute.get('/users/kategori-instansi', ProfileApiController_1.default.getKategoriInstansi);
ApiRoute.post('/auth/reset-password', [(0, jwtAuth_1.jwtAuth)()], ProfileApiController_1.default.changePassword);
ApiRoute.get('/infrastructure/list', InfrastructureApiController_1.default.getAllInfrastruktur);
ApiRoute.get('/infrastructure/:id', InfrastructureApiController_1.default.getInfrastrukturById);
ApiRoute.get('/infrastruktur/sarana-prasarana', InfrastructureApiController_1.default.getAllInfrastruktur);
ApiRoute.get('/booking/infra-user', [(0, jwtAuth_1.jwtAuth)()], InfrastructureApiController_1.default.getBookingInfraList);
ApiRoute.get('/infrastructure/facility-overview', InfrastructureApiController_1.default.getFacilityOverview);
ApiRoute.get('/infrastructure/search-prasarana', InfrastructureApiController_1.default.searchPrasarana);
ApiRoute.post('/booking/booking-ruangan', [(0, jwtAuth_1.jwtAuth)(), rate_limiter_1.uploadRateLimiter.middleware], BookingApiController_1.default.createBooking);
ApiRoute.get('/booking/event/user', [(0, jwtAuth_1.jwtAuth)()], BookingApiController_1.default.getUserBookings);
ApiRoute.get('/booking/jadwal/:prasarana_id/:tanggal', BookingApiController_1.default.getJadwalAvailability);
ApiRoute.get('/booking/show-jadwal/:idPrasarana', (req, res) => {
    req.params.prasarana_id = req.params.idPrasarana;
    req.params.tanggal = req.query_parameters?.date || new Date().toISOString().split('T')[0];
    return BookingApiController_1.default.getJadwalAvailability(req, res);
});
ApiRoute.get('/booking/status', [(0, jwtAuth_1.jwtAuth)()], BookingApiController_1.default.getBookingStatus);
ApiRoute.get('/booking/:booking_id/detail', [(0, jwtAuth_1.jwtAuth)()], BookingApiController_1.default.getBookingDetail);
ApiRoute.get('/event-mcc', EventApiController_1.default.getAllEvents);
ApiRoute.get('/event-mcc/detail/:eventId/:date', EventApiController_1.default.getEventDetail);
ApiRoute.get('/kategori-event', EventApiController_1.default.getKategoriEvent);
ApiRoute.get('/ekraf', EventApiController_1.default.getEkrafCategories);
ApiRoute.get('/prasarana', EventApiController_1.default.getPrasaranaList);
ApiRoute.post('/feedback-data-diri/create', [jwtAuth_1.optionalJwtAuth], FeedbackApiController_1.default.createFeedbackDataDiri);
ApiRoute.post('/user-responded/create', [jwtAuth_1.optionalJwtAuth], FeedbackApiController_1.default.submitOpinionRating);
ApiRoute.post('/feedback-usul/create', [jwtAuth_1.optionalJwtAuth], FeedbackApiController_1.default.submitSuggestionFeedback);
ApiRoute.post('/feedback-lainnya/create/:idBooking?', [jwtAuth_1.optionalJwtAuth], FeedbackApiController_1.default.submitRoomFeedback);
ApiRoute.get('/responded/pertanyaan/pendapat', FeedbackApiController_1.default.getOpinionQuestions);
ApiRoute.delete('/feedback/:id', [(0, jwtAuth_1.jwtAuth)()], FeedbackApiController_1.default.deleteFeedback);
ApiRoute.get('/feedback/statistics', [(0, jwtAuth_1.jwtAuth)()], FeedbackApiController_1.default.getFeedbackStatistics);
ApiRoute.get('/kategori', KategoriApiController_1.default.getKategori);
exports.default = ApiRoute;
//# sourceMappingURL=api.js.map