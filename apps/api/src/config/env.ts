export type ApiNodeEnv = 'development' | 'test' | 'production';

export interface ApiEnvironment {
  NODE_ENV: ApiNodeEnv;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  GITHUB_ID: string;
  GITHUB_SECRET: string;
  API_URL: string;
  FRONTEND_URL: string;
  COOKIE_DOMAIN?: string;
}

const REQUIRED_KEYS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'GITHUB_ID',
  'GITHUB_SECRET',
  'API_URL',
  'FRONTEND_URL',
] as const;

function parseUrl(
  name: string,
  value: string,
  allowedProtocols: string[],
  errors: string[],
): URL | null {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (!allowedProtocols.includes(url.protocol)) {
      errors.push(
        `${name} must use one of these protocols: ${allowedProtocols.join(', ')}`,
      );
    }

    return url;
  } catch {
    errors.push(`${name} must be a valid URL`);
    return null;
  }
}

function isOriginOnly(url: URL): boolean {
  return url.pathname === '/' && !url.search && !url.hash;
}

function normalizeCookieDomain(value: string | undefined): string {
  return (value?.trim() ?? '').replace(/^\./, '').toLowerCase();
}

function hostMatchesCookieDomain(hostname: string, cookieDomain: string): boolean {
  const host = hostname.toLowerCase();
  return host === cookieDomain || host.endsWith(`.${cookieDomain}`);
}

export function validateApiEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): ApiEnvironment {
  const errors: string[] = [];
  const values = new Map<string, string>();

  for (const key of REQUIRED_KEYS) {
    const value = source[key]?.trim() ?? '';

    if (!value) {
      errors.push(`${key} is required`);
    }

    values.set(key, value);
  }

  const nodeEnv = (source.NODE_ENV?.trim() || 'development') as ApiNodeEnv;
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    errors.push('NODE_ENV must be development, test, or production');
  }

  const rawPort = source.PORT?.trim() || '3001';
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push('PORT must be an integer between 1 and 65535');
  }

  const databaseUrl = values.get('DATABASE_URL') ?? '';
  const jwtSecret = values.get('JWT_SECRET') ?? '';
  const apiUrl = values.get('API_URL') ?? '';
  const frontendUrl = values.get('FRONTEND_URL') ?? '';
  const cookieDomain = normalizeCookieDomain(source.COOKIE_DOMAIN);

  parseUrl('DATABASE_URL', databaseUrl, ['postgres:', 'postgresql:'], errors);
  const parsedApiUrl = parseUrl('API_URL', apiUrl, ['http:', 'https:'], errors);
  const parsedFrontendUrl = parseUrl(
    'FRONTEND_URL',
    frontendUrl,
    ['http:', 'https:'],
    errors,
  );

  for (const [name, parsed] of [
    ['API_URL', parsedApiUrl],
    ['FRONTEND_URL', parsedFrontendUrl],
  ] as const) {
    if (parsed && !isOriginOnly(parsed)) {
      errors.push(`${name} must be an origin without path, query, or hash`);
    }
  }

  if (nodeEnv === 'production') {
    if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must contain at least 32 characters in production');
    }

    for (const [name, parsed] of [
      ['API_URL', parsedApiUrl],
      ['FRONTEND_URL', parsedFrontendUrl],
    ] as const) {
      if (parsed && parsed.protocol !== 'https:') {
        errors.push(`${name} must use https in production`);
      }
    }

    if (!cookieDomain) {
      errors.push('COOKIE_DOMAIN is required in production');
    } else {
      if (
        cookieDomain.includes('/') ||
        cookieDomain.includes(':') ||
        cookieDomain === 'localhost'
      ) {
        errors.push(
          'COOKIE_DOMAIN must be a bare parent domain such as example.com',
        );
      }

      if (
        parsedApiUrl &&
        !hostMatchesCookieDomain(parsedApiUrl.hostname, cookieDomain)
      ) {
        errors.push('COOKIE_DOMAIN must cover the API_URL hostname');
      }

      if (
        parsedFrontendUrl &&
        !hostMatchesCookieDomain(parsedFrontendUrl.hostname, cookieDomain)
      ) {
        errors.push('COOKIE_DOMAIN must cover the FRONTEND_URL hostname');
      }
    }

    if (
      parsedApiUrl &&
      parsedFrontendUrl &&
      parsedApiUrl.hostname === parsedFrontendUrl.hostname
    ) {
      errors.push(
        'API_URL and FRONTEND_URL must use distinct sibling hosts for the configured production auth architecture',
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      [
        'Invalid API environment configuration:',
        ...errors.map((error) => `- ${error}`),
      ].join('\n'),
    );
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    GITHUB_ID: values.get('GITHUB_ID') ?? '',
    GITHUB_SECRET: values.get('GITHUB_SECRET') ?? '',
    API_URL: apiUrl,
    FRONTEND_URL: frontendUrl,
    ...(cookieDomain ? { COOKIE_DOMAIN: cookieDomain } : {}),
  };
}
