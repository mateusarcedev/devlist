import { validateApiEnvironment } from './env';

function validEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'development',
    PORT: '3001',
    DATABASE_URL: 'postgresql://devlist:devlist@localhost:5432/devlist',
    JWT_SECRET: 'development-secret',
    GITHUB_ID: 'github-client-id',
    GITHUB_SECRET: 'github-client-secret',
    API_URL: 'http://localhost:3001',
    FRONTEND_URL: 'http://localhost:3000',
    ...overrides,
  };
}

function validProductionEnv(
  overrides: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
  return validEnv({
    NODE_ENV: 'production',
    JWT_SECRET: '0123456789abcdef0123456789abcdef',
    API_URL: 'https://api.example.com',
    FRONTEND_URL: 'https://app.example.com',
    COOKIE_DOMAIN: 'example.com',
    ...overrides,
  });
}

describe('validateApiEnvironment', () => {
  it('accepts a complete development environment without COOKIE_DOMAIN', () => {
    expect(validateApiEnvironment(validEnv())).toEqual(
      expect.objectContaining({
        NODE_ENV: 'development',
        PORT: 3001,
        API_URL: 'http://localhost:3001',
        FRONTEND_URL: 'http://localhost:3000',
      }),
    );
  });

  it('reports all missing required variables together', () => {
    expect(() => validateApiEnvironment({ NODE_ENV: 'development' })).toThrow(
      /DATABASE_URL is required[\s\S]*JWT_SECRET is required[\s\S]*GITHUB_ID is required/,
    );
  });

  it('requires a strong JWT secret in production', () => {
    expect(() =>
      validateApiEnvironment(
        validProductionEnv({
          JWT_SECRET: 'too-short',
        }),
      ),
    ).toThrow('JWT_SECRET must contain at least 32 characters in production');
  });

  it('requires HTTPS public URLs in production', () => {
    expect(() =>
      validateApiEnvironment(
        validProductionEnv({
          API_URL: 'http://api.example.com',
          FRONTEND_URL: 'http://app.example.com',
        }),
      ),
    ).toThrow(/API_URL must use https in production/);
  });

  it('requires COOKIE_DOMAIN in production', () => {
    expect(() =>
      validateApiEnvironment(
        validProductionEnv({
          COOKIE_DOMAIN: '',
        }),
      ),
    ).toThrow('COOKIE_DOMAIN is required in production');
  });

  it('requires COOKIE_DOMAIN to cover both sibling hosts', () => {
    expect(() =>
      validateApiEnvironment(
        validProductionEnv({
          COOKIE_DOMAIN: 'api.example.com',
        }),
      ),
    ).toThrow('COOKIE_DOMAIN must cover the FRONTEND_URL hostname');
  });

  it('normalizes a leading dot in COOKIE_DOMAIN', () => {
    expect(
      validateApiEnvironment(
        validProductionEnv({
          COOKIE_DOMAIN: '.example.com',
        }),
      ).COOKIE_DOMAIN,
    ).toBe('example.com');
  });

  it('rejects public URLs with paths because they are used as origins', () => {
    expect(() =>
      validateApiEnvironment(
        validProductionEnv({
          FRONTEND_URL: 'https://app.example.com/dashboard',
        }),
      ),
    ).toThrow('FRONTEND_URL must be an origin without path, query, or hash');
  });

  it('rejects the same production host for API and frontend', () => {
    expect(() =>
      validateApiEnvironment(
        validProductionEnv({
          API_URL: 'https://app.example.com',
        }),
      ),
    ).toThrow(
      'API_URL and FRONTEND_URL must use distinct sibling hosts for the configured production auth architecture',
    );
  });

  it('rejects an invalid port', () => {
    expect(() => validateApiEnvironment(validEnv({ PORT: '70000' }))).toThrow(
      'PORT must be an integer between 1 and 65535',
    );
  });
});
