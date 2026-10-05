import type { CookieOptions } from 'express';

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function sharedCookieBase(): CookieOptions {
  const production = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN?.trim().replace(/^\\./, '');

  return {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    ...(production && domain ? { domain } : {}),
  };
}

export function accessCookieOptions(): CookieOptions {
  return {
    ...sharedCookieBase(),
    maxAge: ACCESS_COOKIE_MAX_AGE,
    path: '/',
  };
}

export function refreshCookieOptions(): CookieOptions {
  return {
    ...sharedCookieBase(),
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: '/auth',
  };
}

export function accessCookieClearOptions(): CookieOptions {
  return {
    ...sharedCookieBase(),
    path: '/',
  };
}

export function refreshCookieClearOptions(): CookieOptions {
  return {
    ...sharedCookieBase(),
    path: '/auth',
  };
}
