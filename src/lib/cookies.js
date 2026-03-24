// Cookie configuration for HttpOnly JWT auth
const isProduction = process.env.NODE_ENV === 'production';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

// Max ages in seconds
export const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

/**
 * Set auth cookies on a NextResponse.
 */
export function setAuthCookies(response, accessToken, refreshToken) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  if (refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  return response;
}

/**
 * Clear auth cookies on a NextResponse.
 */
export function clearAuthCookies(response) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}

/**
 * Read a cookie value from a request.
 */
export function getCookie(request, name) {
  const cookie = request.cookies?.get(name);
  return cookie?.value || null;
}
