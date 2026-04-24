export const BCRYPT_SALT_ROUNDS = 10;
export const MIN_PASSWORD_LENGTH = 6;
export const ACCESS_TOKEN_EXPIRY = '30m';
export const REFRESH_TOKEN_EXPIRY = '30d';
export const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
export const REFRESH_COOKIE_NAME = 'refreshToken';
export const TOKEN_TYPE_ACCESS = 'access';
export const TOKEN_TYPE_REFRESH = 'refresh';
