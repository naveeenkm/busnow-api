// Re-export from separate files
export * from './auth.js';
export * from './roles.js';

// HTTP status codes
export const HTTP_OK = 200;
export const HTTP_CREATED = 201;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_CONFLICT = 409;
export const HTTP_SERVER_ERROR = 500;
export const HTTP_SERVICE_UNAVAILABLE = 503;

// Bus
export const BUS_STATUS_APPROVED = 'approved';
export const DEFAULT_FREQUENCY = 'Every day';
export const NEARBY_MAX_KM = 50;
export const POPULAR_ROUTES_LIMIT = 6;
export const GEOCODE_DELAY_MS = 400;
export const GEOCODE_RESULT_LIMIT = 5;
export const GEOCODE_USER_AGENT = 'busnow-app/1.0';
export const GEOCODE_STATE = 'karnataka';
export const GEOCODE_COUNTRY = 'in';

// Route request
export const REQUEST_STATUS_APPROVED = 'approved';
export const REQUEST_STATUS_REJECTED = 'rejected';
export const VALID_REQUEST_STATUSES = [REQUEST_STATUS_APPROVED, REQUEST_STATUS_REJECTED];

// Error messages
import { MIN_PASSWORD_LENGTH } from './auth.js';
export const MSG_SERVER_ERROR = 'Server error';
export const MSG_NOT_FOUND = 'Not found';
export const MSG_UNAUTHORIZED = 'Unauthorized';
export const MSG_ALL_FIELDS_REQUIRED = 'All fields required';
export const MSG_EMAIL_PASSWORD_REQUIRED = 'Email and password required';
export const MSG_INVALID_CREDENTIALS = 'Invalid credentials';
export const MSG_PASSWORD_TOO_SHORT = `Password must be ${MIN_PASSWORD_LENGTH}+ chars`;
export const MSG_EMAIL_ALREADY_REGISTERED = 'Email already registered';
export const MSG_NO_REFRESH_TOKEN = 'No refresh token';
export const MSG_INVALID_REFRESH_TOKEN = 'Invalid or expired refresh token';
export const MSG_USER_NOT_FOUND = 'User not found';
export const MSG_BUS_NOT_FOUND = 'Bus not found';
export const MSG_REQUEST_NOT_FOUND = 'Request not found';
export const MSG_INVALID_TOKEN_TYPE = 'Invalid token type';
export const MSG_LOGGED_OUT = 'Logged out';
export const MSG_BUS_FIELDS_REQUIRED = 'fromCity, toCity and arrivalTime are required';
export const MSG_FROM_TO_REQUIRED = 'from and to required';
export const MSG_CITIES_REQUIRED = 'fromCity and toCity required';
export const MSG_INVALID_STATUS = 'Invalid status';
export const MSG_CURRENT_PASSWORD_REQUIRED = 'Current password required';
export const MSG_CURRENT_PASSWORD_INCORRECT = 'Current password is incorrect';
export const MSG_CANNOT_DELETE_SELF = "You can't delete yourself";
export const MSG_ADMIN_REQUIRED = 'Admin access required';
