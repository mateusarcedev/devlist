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

describe('validateApiEnvironment', () => {
  it('accepts a complete development environment', () => {
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
        validEnv({
          NODE_ENV: 'production',
          JWT_SECRET: 'too-short',
          API_URL: 'https://api.example.com',
          FRONTEND_URL: 'https://example.com',
        }),
      ),
    ).toThrow('JWT_SECRET must contain at least 32 characters in production');
  });

  it('requires HTTPS public URLs in production', () => {
    expect(() =>
      validateApiEnvironment(
        validEnv({
          NODE_ENV: 'production',
          JWT_SECRET: '0123456789abcdef0123456789abcdef',
          API_URL: 'http://api.example.com',
          FRONTEND_URL: 'http://example.com',
        }),
      ),
    ).toThrow(/API_URL must use https in production/);
  });

  it('rejects an invalid port', () => {
    expect(() => validateApiEnvironment(validEnv({ PORT: '70000' }))).toThrow(
      'PORT must be an integer between 1 and 65535',
    );
  });
});
