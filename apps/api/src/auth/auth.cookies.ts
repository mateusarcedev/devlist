import type { CookieOptions } from 'express';

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function secureCookieBase(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };
}

function sharedAccessCookieBase(): CookieOptions {
  const production = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN?.trim().replace(/^\./, '');

  return {
    ...secureCookieBase(),
    ...(production && domain ? { domain } : {}),
  };
}

export function accessCookieOptions(): CookieOptions {
  return {
    ...sharedAccessCookieBase(),
    maxAge: ACCESS_COOKIE_MAX_AGE,
    path: '/',
  };
}

export function refreshCookieOptions(): CookieOptions {
  return {
    ...secureCookieBase(),
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: '/auth',
  };
}

export function accessCookieClearOptions(): CookieOptions {
  return {
    ...sharedAccessCookieBase(),
    path: '/',
  };
}

export function refreshCookieClearOptions(): CookieOptions {
  return {
    ...secureCookieBase(),
    path: '/auth',
  };
}
