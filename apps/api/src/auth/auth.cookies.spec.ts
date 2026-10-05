import {
  accessCookieClearOptions,
  accessCookieOptions,
  refreshCookieClearOptions,
  refreshCookieOptions,
} from './auth.cookies';

describe('auth cookie options', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDomain = process.env.COOKIE_DOMAIN;

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;

    if (originalDomain === undefined) delete process.env.COOKIE_DOMAIN;
    else process.env.COOKIE_DOMAIN = originalDomain;
  });

  it('keeps local-development cookies host-only and non-secure', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.COOKIE_DOMAIN;

    expect(accessCookieOptions()).toEqual(
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      }),
    );
    expect(accessCookieOptions()).not.toHaveProperty('domain');
  });

  it('shares production cookies across sibling subdomains', () => {
    process.env.NODE_ENV = 'production';
    process.env.COOKIE_DOMAIN = 'example.com';

    expect(accessCookieOptions()).toEqual(
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        domain: 'example.com',
        path: '/',
      }),
    );

    expect(refreshCookieOptions()).toEqual(
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        domain: 'example.com',
        path: '/auth/refresh',
      }),
    );
  });

  it('clears cookies with the same domain and paths used when setting them', () => {
    process.env.NODE_ENV = 'production';
    process.env.COOKIE_DOMAIN = 'example.com';

    expect(accessCookieClearOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain: 'example.com',
      path: '/',
    });

    expect(refreshCookieClearOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain: 'example.com',
      path: '/auth/refresh',
    });
  });
});
